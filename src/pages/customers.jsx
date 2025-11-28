// src/pages/Customers.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";
import FormModal from "../components/FormModal";

const emptyForm = {
  name: "",
  business_type: "",
  address: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
};

export default function Customers() {
  const api = useApi();
  const userRole = useRoleCheck();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/customers");
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.business_type) {
      alert("กรุณากรอก Name และ Business Type");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/customers/${editingId}`, form);
      } else {
        await api.post("/api/customers", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setIsFormOpen(false);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving customer");
    }
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      business_type: c.business_type || "",
      address: c.address || "",
      contact_name: c.contact_name || "",
      contact_phone: c.contact_phone || "",
      contact_email: c.contact_email || "",
    });
    setIsFormOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบลูกค้ารายนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/customers/${id}`);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting customer");
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

  return (
    <ProtectedPage userRole={userRole} allowedRoles="admin">
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Customers</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลลูกค้า (ชื่อองค์กร / ประเภทธุรกิจ / ผู้ติดต่อ / เบอร์โทร)
          </p>
        </div>

        {error && <div className="card error">{error}</div>}

        {/* ปุ่มสร้างใหม่ */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="button primary"
            onClick={handleOpenForm}
          >
            + Add New Customer
          </button>
        </div>

        {/* Modal Form */}
        <FormModal
          isOpen={isFormOpen}
          title={editingId ? "Edit Customer" : "New Customer"}
          onClose={handleCloseForm}
        >
          <form onSubmit={handleSubmit}>
            {/* แถว Name + Business Type */}
            <div className="form-row">
              <div>
                <label>
                  Building Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Business Type *
                  <input
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
                    className="input"
                    placeholder="เช่น Building Owner, FM Company ฯลฯ"
                  />
                </label>
              </div>
            </div>

            {/* Address */}
            <label>
              Address
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="input"
                rows={2}
              />
            </label>

            {/* แถว Contact Name + Phone */}
            <div className="form-row">
              <div>
                <label>
                  Contact Name
                  <input
                    name="contact_name"
                    value={form.contact_name}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Contact Phone
                  <input
                    name="contact_phone"
                    value={form.contact_phone}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* Email */}
            <label>
              Contact Email
              <input
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                className="input"
              />
            </label>

            {/* ปุ่ม */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="button primary">
                {editingId ? "Save" : "Create"}
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

        {/* ตารางลูกค้า */}
        {!loading && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Customer List</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business Type</th>
                  <th>Contact</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.business_type}</td>
                    <td>
                      {c.contact_name}
                      {c.contact_phone && ` (${c.contact_phone})`}
                      {c.contact_email && (
                        <>
                          <br />
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--color-gray)",
                            }}
                          >
                            {c.contact_email}
                          </span>
                        </>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="button sm secondary"
                        type="button"
                        onClick={() => handleEdit(c)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        className="button sm danger"
                        type="button"
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      No customers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div className="card">Loading customers...</div>}
      </div>
    </ProtectedPage>
  );
}