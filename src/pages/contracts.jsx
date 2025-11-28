// src/pages/contracts.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";
import FormModal from "../components/FormModal";

const emptyForm = {
  customer_id: "",
  contract_code: "",
  contract_type: "annual", // annual / per_call
  start_date: "",
  end_date: "",
  maintenance_times_per_year: "",
  included_items: "",
  excluded_items: "",
  notify_before_days: "30",
};

export default function Contracts() {
  const api = useApi();
  const userRole = useRoleCheck();
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [cs, ct] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/contracts"),
      ]);
      setCustomers(cs || []);
      setContracts(ct || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    // ถ้าเปลี่ยน contract_type
    if (name === "contract_type") {
      if (value === "per_call") {
        // เปลี่ยนเป็น per_call ให้ clear notify_before_days และ maintenance_times_per_year
        setForm((f) => ({
          ...f,
          [name]: value,
          notify_before_days: "", //
          maintenance_times_per_year: "", // [New]: Clear maintenance times for Per Call
        }));
      } else if (value === "annual") {
        // เปลี่ยนเป็น annual ให้ตั้งค่า default เป็น 30
        setForm((f) => ({ ...f, [name]: value, notify_before_days: "30" }));
      } else {
        setForm((f) => ({ ...f, [name]: value }));
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.customer_id || !form.contract_code || !form.contract_type) {
      alert("กรุณาเลือกลูกค้า และกรอก Contract Code / Type");
      return;
    }
    if (!form.start_date || !form.end_date) {
      alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดสัญญา");
      return;
    }

    const payload = {
      customer_id: Number(form.customer_id),
      contract_code: form.contract_code,
      contract_type: form.contract_type,
      start_date: form.start_date,
      end_date: form.end_date,
      maintenance_times_per_year: form.maintenance_times_per_year
        ? Number(form.maintenance_times_per_year)
        : 0, // (Keeps existing logic to default to 0 if input is empty)
      included_items: form.included_items || null, //
      excluded_items: form.excluded_items || null, //
      notify_before_days:
        form.contract_type === "per_call"
          ? null // (Correctly sets to null for backend)
          : form.notify_before_days &&
            form.notify_before_days !== "ไม่ใช้สำหรับ Per Call contract"
          ? Number(form.notify_before_days)
          : 30, //
    };

    try {
      if (editingId) {
        await api.put(`/api/contracts/${editingId}`, payload);
      } else {
        await api.post("/api/contracts", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving contract");
    }
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({
      customer_id: c.customer_id != null ? String(c.customer_id) : "", //
      contract_code: c.contract_code || "", //
      contract_type: c.contract_type || "annual", //
      start_date: c.start_date ? c.start_date.slice(0, 10) : "", //
      end_date: c.end_date ? c.end_date.slice(0, 10) : "", //
      maintenance_times_per_year:
        c.contract_type === "per_call"
          ? "" // [New]: Set to empty string for consistent UI for Per Call on edit
          : c.maintenance_times_per_year != null
          ? String(c.maintenance_times_per_year)
          : "",
      included_items: c.included_items || "", //
      excluded_items: c.excluded_items || "", //
      notify_before_days:
        c.contract_type === "per_call"
          ? "" // [New]: Set to empty string for consistent form state on edit
          : c.notify_before_days != null
          ? String(c.notify_before_days)
          : "30",
    });
    setIsFormOpen(true); //
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบสัญญานี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/contracts/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting contract");
    }
  }

  function handleOpenForm() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function renderCustomerName(customer_id) {
    const c = customers.find((x) => x.id === customer_id);
    return c ? c.name : `#${customer_id}`;
  }

  function renderTypeLabel(type) {
    if (type === "per_call") return "Per Call";
    if (type === "annual") return "Annual";
    return type;
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles="admin">
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Contracts</h2>
          <p className="app-page-subtitle">
            จัดการสัญญาบำรุงรักษา (รายปี / จ่ายต่อครั้ง) ของลูกค้า
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="button primary"
            onClick={handleOpenForm}
          >
            + Add New Contract
          </button>
        </div>

        <FormModal
          isOpen={isFormOpen}
          title={editingId ? "Edit Contract" : "New Contract"}
          onClose={handleCloseForm}
        >
          <form onSubmit={handleSubmit}>
            {/* แถว Customer */}
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

            {/* แถว Code + Type */}
            <div className="form-row">
              <div>
                <label>
                  Contract Code *
                  <input
                    name="contract_code"
                    value={form.contract_code}
                    onChange={handleChange}
                    className="input"
                    placeholder="เช่น CT-2025-001"
                  />
                </label>
              </div>
              <div>
                <label>
                  Contract Type *
                  <select
                    name="contract_type"
                    value={form.contract_type}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="annual">Annual (รายปี)</option>
                    <option value="per_call">Per Call (จ่ายต่อครั้ง)</option>
                  </select>
                </label>
              </div>
            </div>

            {/* แถว Start / End date */}
            <div className="form-row">
              <div>
                <label>
                  Start Date *
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  End Date *
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    className="input"
                    min={form.start_date || undefined}
                  />
                </label>
              </div>
            </div>

            {/* แถว Maint/year + Notify before */}
            <div className="form-row">
              <div>
                <label>
                  Maintenance / Year
                  <input
                    type="number"
                    name="maintenance_times_per_year"
                    value={form.maintenance_times_per_year}
                    onChange={handleChange}
                    className="input"
                    placeholder="เช่น 4 (ตรวจ 4 ครั้ง/ปี)"
                  />
                </label>
              </div>
              <div>
                <label>
                  Notify Before (days)
                  <input
                    type={form.contract_type === "per_call" ? "text" : "number"}
                    name="notify_before_days"
                    value={
                      form.contract_type === "per_call"
                        ? "ไม่ใช้สำหรับ Per Call contract"
                        : form.notify_before_days
                    }
                    onChange={handleChange}
                    className="input"
                    disabled={form.contract_type === "per_call"}
                    readOnly={form.contract_type === "per_call"}
                    style={
                      form.contract_type === "per_call"
                        ? { color: "#6b7280", fontStyle: "italic" }
                        : {}
                    }
                  />
                </label>
              </div>
            </div>

            {/* Included / Excluded */}
            <label>
              Included Items
              <textarea
                name="included_items"
                value={form.included_items}
                onChange={handleChange}
                className="input"
                rows={2}
                placeholder="รายการที่รวมในสัญญา เช่น ค่าแรง, ค่าเดินทาง, ตรวจเช็คตามแผน ฯลฯ"
              />
            </label>

            <label>
              Excluded Items
              <textarea
                name="excluded_items"
                value={form.excluded_items}
                onChange={handleChange}
                className="input"
                rows={2}
                placeholder="รายการที่ไม่รวม เช่น ค่าอะไหล่ใหญ่, ค่า Overhaul ฯลฯ"
              />
            </label>

            {/* ปุ่ม */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="button primary">
                {editingId ? "Save Changes" : "Create"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleCloseForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </FormModal>

        {/* ตารางสัญญา */}
        {loading && <div className="card">Loading...</div>}
        {error && <div className="card error">{error}</div>}

        {!loading && !error && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Contract List</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Maint./Year</th>
                  <th style={{ width: 130 }} />
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td>{c.contract_code}</td>
                    <td>
                      {c.customer_name || renderCustomerName(c.customer_id)}
                    </td>
                    <td>{renderTypeLabel(c.contract_type)}</td>
                    <td>
                      {c.start_date?.slice(0, 10)} - {c.end_date?.slice(0, 10)}
                    </td>
                    <td>{c.maintenance_times_per_year}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="button sm secondary"
                        onClick={() => handleEdit(c)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="button sm danger"
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No contracts.
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
