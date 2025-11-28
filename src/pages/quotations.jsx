// src/pages/quotations.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyForm = {
  quotation_code: "",
  customer_id: "",
  contract_id: "",
  ticket_id: "",
  status: "draft", // draft / sent / approved / rejected
  total_amount: "",
};

export default function Quotations() {
  const api = useApi();
  const userRole = useRoleCheck();
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [callFee, setCallFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [qs, cs, ct, js, settings] = await Promise.all([
        api.get("/api/quotations"),
        api.get("/api/customers"),
        api.get("/api/contracts"),
        api.get("/api/maintenance/jobs"),
        api.get("/api/pricing-settings"),
      ]);
      setQuotations(qs);
      setCustomers(cs);
      setContracts(ct);
      setJobs(js);
      setCallFee(settings?.call_fee || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    
    // ถ้าเลือก contract ให้ auto-fill total amount จาก maintenance jobs
    if (name === "contract_id" && value) {
      const contractJobs = jobs.filter((j) => Number(j.contract_id) === Number(value));
      const totalAmount = contractJobs.reduce((sum, job) => {
        const jobTotal = Number(job.labor_cost || 0) + Number(job.parts_cost || 0) + Number(callFee || 0);
        return sum + jobTotal;
      }, 0);
      
      setForm((f) => ({
        ...f,
        [name]: value,
        total_amount: String(totalAmount.toFixed(2)),
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_id) {
      alert("กรุณาเลือกลูกค้า");
      return;
    }

    const payload = {
      quotation_code: form.quotation_code || undefined, // ให้ backend gen ถ้าไม่กรอก
      customer_id: Number(form.customer_id),
      contract_id: form.contract_id ? Number(form.contract_id) : null,
      ticket_id: form.ticket_id || null,
      status: form.status || "draft",
      total_amount: form.total_amount
        ? Number(form.total_amount)
        : 0,
    };

    try {
      if (editingId) {
        await api.put(`/api/quotations/${editingId}`, {
          quotation_code:
            payload.quotation_code ||
            form.quotation_code ||
            `Q-${Date.now()}`, // PUT ต้องมี code แน่นอน
          customer_id: payload.customer_id,
          contract_id: payload.contract_id,
          ticket_id: payload.ticket_id,
          status: payload.status,
          total_amount: payload.total_amount,
        });
      } else {
        await api.post("/api/quotations", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving quotation");
    }
  }

  function handleEdit(q) {
    setEditingId(q.id);
    setForm({
      quotation_code: q.quotation_code || "",
      customer_id: q.customer_id,
      contract_id: q.contract_id || "",
      ticket_id: q.ticket_id || "",
      status: q.status || "draft",
      total_amount:
        q.total_amount != null ? String(q.total_amount) : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบใบเสนอราคานี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/quotations/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting quotation");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function renderCustomerName(customer_id) {
    const c = customers.find((x) => x.id === customer_id);
    return c ? c.name : `#${customer_id}`;
  }

  function renderContractCode(contract_id) {
    if (!contract_id) return "-";
    const c = contracts.find((x) => x.id === contract_id);
    return c ? c.contract_code : `#${contract_id}`;
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles="admin">
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Quotations</h2>
          <p className="app-page-subtitle">
            จัดการใบเสนอราคาให้ลูกค้า พร้อมสถานะการส่ง / อนุมัติ
          </p>
        </div>

        {/* ฟอร์ม */}
        <div className="card">
          <div className="card-title">
            {editingId ? "Edit Quotation" : "New Quotation"}
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Customer *
              <select
                name="customer_id"
                value={form.customer_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">-- select customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Contract + Quotation Code */}
            <div className="form-row">
              <div>
                <label>
                  Contract
                  <select
                    name="contract_id"
                    value={form.contract_id}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">-- none --</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_code} ({renderCustomerName(c.customer_id)})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Quotation Code
                  <input
                    name="quotation_code"
                    value={form.quotation_code}
                    onChange={handleChange}
                    className="input"
                    placeholder="ไม่กรอกให้ระบบ gen ให้อัตโนมัติ"
                  />
                </label>
              </div>
            </div>

            {/* Ticket ID */}
            <label>
              Ticket ID (อ้างอิงใบแจ้งซ่อม ถ้ามี)
              <input
                name="ticket_id"
                value={form.ticket_id}
                onChange={handleChange}
                className="input"
              />
            </label>

            {/* Status + Total */}
            <div className="form-row">
              <div>
                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Total Amount
                  <input
                    type="number"
                    name="total_amount"
                    value={form.total_amount}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" className="button primary">
                {editingId ? "Save Changes" : "Create"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ตาราง */}
        {loading && <div className="card">Loading...</div>}
        {error && <div className="card error">{error}</div>}

        {!loading && !error && (
          <div className="card">
            <div className="card-title">Quotation List</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Contract</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td>{q.quotation_code}</td>
                    <td>
                      {q.customer_name || renderCustomerName(q.customer_id)}
                    </td>
                    <td>{renderContractCode(q.contract_id)}</td>
                    <td>{q.status}</td>
                    <td>{q.total_amount}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="button-sm-secondary"
                        type="button"
                        onClick={() => handleEdit(q)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        className="button sm danger"
                        type="button"
                        onClick={() => handleDelete(q.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {quotations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No quotations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}