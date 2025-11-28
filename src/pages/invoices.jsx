// src/pages/invoices.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyForm = {
  invoice_code: "",
  customer_id: "",
  quotation_id: "",
  total_amount: "",
  paid_amount: "",
  status: "unpaid", // unpaid / partial / paid / cancelled
  due_date: "",
};

export default function Invoices() {
  const api = useApi();
  const userRole = useRoleCheck();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [inv, cs, qs] = await Promise.all([
        api.get("/api/invoices"),
        api.get("/api/customers"),
        api.get("/api/quotations"),
      ]);
      setInvoices(inv || []);
      setCustomers(cs || []);
      setQuotations(qs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    
    // ถ้าเลือก quotation ให้ auto-fill total amount จากข้อมูล quotation
    if (name === "quotation_id" && value) {
      const selectedQuotation = quotations.find((q) => Number(q.id) === Number(value));
      setForm((f) => ({
        ...f,
        [name]: value,
        total_amount: selectedQuotation?.total_amount 
          ? String(selectedQuotation.total_amount) 
          : "",
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
      invoice_code: form.invoice_code || undefined, // backend gen ถ้าไม่ส่ง
      customer_id: Number(form.customer_id),
      quotation_id: form.quotation_id ? Number(form.quotation_id) : null,
      total_amount: form.total_amount ? Number(form.total_amount) : 0,
      paid_amount: form.paid_amount ? Number(form.paid_amount) : 0,
      status: form.status || "unpaid",
      due_date: form.due_date || null,
    };

    try {
      if (editingId) {
        await api.put(`/api/invoices/${editingId}`, {
          invoice_code:
            payload.invoice_code || form.invoice_code || `I-${Date.now()}`,
          customer_id: payload.customer_id,
          quotation_id: payload.quotation_id,
          total_amount: payload.total_amount,
          paid_amount: payload.paid_amount,
          status: payload.status,
          due_date: payload.due_date,
        });
      } else {
        await api.post("/api/invoices", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving invoice");
    }
  }

  function handleEdit(i) {
    setEditingId(i.id);
    setForm({
      invoice_code: i.invoice_code || "",
      customer_id: i.customer_id,
      quotation_id: i.quotation_id || "",
      total_amount:
        i.total_amount != null ? String(i.total_amount) : "",
      paid_amount:
        i.paid_amount != null ? String(i.paid_amount) : "",
      status: i.status || "unpaid",
      due_date: i.due_date ? i.due_date.slice(0, 10) : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบใบแจ้งหนี้นี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/invoices/${id}`); // แก้จาก api.del
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting invoice");
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

  function renderQuotationCode(quotation_id) {
    if (!quotation_id) return "-";
    const q = quotations.find((x) => x.id === quotation_id);
    return q ? q.quotation_code : `#${quotation_id}`;
  }

  function renderStatusLabel(status) {
    if (!status) return "Unpaid";
    const s = String(status).toLowerCase();
    if (s === "unpaid") return "Unpaid";
    if (s === "partial") return "Partial";
    if (s === "paid") return "Paid";
    if (s === "cancelled") return "Cancelled";
    return status;
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles="admin">
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Invoices</h2>
          <p className="app-page-subtitle">
            จัดการใบแจ้งหนี้จากใบเสนอราคา และสถานะการชำระเงินของลูกค้า
          </p>
        </div>

        {/* ฟอร์ม */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {editingId ? "Edit Invoice" : "New Invoice"}
            </div>
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

            <label>
              Quotation
              <select
                name="quotation_id"
                value={form.quotation_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">-- none --</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quotation_code} ({renderCustomerName(q.customer_id)})
                  </option>
                ))}
              </select>
            </label>

            {/* Invoice code + Due date */}
            <div className="form-row">
              <div>
                <label>
                  Invoice Code
                  <input
                    name="invoice_code"
                    value={form.invoice_code}
                    onChange={handleChange}
                    className="input"
                    placeholder="ไม่กรอกให้ระบบ gen ให้อัตโนมัติ"
                  />
                </label>
              </div>
              <div>
                <label>
                  Due Date
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* Amounts */}
            <div className="form-row">
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
              <div>
                <label>
                  Paid Amount
                  <input
                    type="number"
                    name="paid_amount"
                    value={form.paid_amount}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* Status */}
            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="input"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            {/* ปุ่ม */}
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
            <div className="card-header">
              <div className="card-title">Invoice List</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Quotation</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th style={{ width: 130 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td>{i.invoice_code}</td>
                    <td>
                      {i.customer_name || renderCustomerName(i.customer_id)}
                    </td>
                    <td>{renderQuotationCode(i.quotation_id)}</td>
                    <td>{renderStatusLabel(i.status)}</td>
                    <td>{i.total_amount}</td>
                    <td>{i.paid_amount}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="button sm secondary"
                        onClick={() => handleEdit(i)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="button sm danger"
                        onClick={() => handleDelete(i.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No invoices.
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