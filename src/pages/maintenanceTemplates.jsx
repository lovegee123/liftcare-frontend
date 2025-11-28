// src/pages/maintenanceTemplates.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyForm = {
  name: "",
  description: "",
};

export default function MaintenanceTemplates() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/maintenance/templates");
      setTemplates(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name) {
      alert("กรุณากรอก Template Name");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/maintenance/templates/${editingId}`, form);
      } else {
        await api.post("/api/maintenance/templates", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadTemplates();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving template");
    }
  }

  function handleEdit(t) {
    setEditingId(t.id);
    setForm({
      name: t.name || "",
      description: t.description || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบ Template นี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/maintenance/templates/${id}`);
      await loadTemplates();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting template");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Maintenance Templates</h2>
          <p className="app-page-subtitle">
            ตั้งชุดรายการตรวจเช็ค / งานบำรุงมาตรฐาน เพื่อใช้กับ Maintenance Plans
          </p>
        </div>

        {/* ฟอร์มสร้าง/แก้ไข - เฉพาะ admin */}
        {userRole === "admin" && (
          <div className="card">
            <div className="card-title">
              {editingId ? "Edit Template" : "New Template"}
            </div>

            <form onSubmit={handleSubmit}>
            <label>
              Template Name *
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input"
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input"
                rows={8}
              />
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" className="button primary">
                {editingId ? "Update" : "Create"}
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
        )}

        {/* ตารางรายการ Templates */}
        <div className="card">
          <div className="card-title">Template List</div>

          {loading && <div>Loading templates...</div>}
          {error && <div className="card error">{error}</div>}

          {!loading && !error && (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Template Name</th>
                  <th>Description</th>
                  {userRole === "admin" && <th style={{ width: 140 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.name}</td>
                    <td>{t.description || "-"}</td>
                    {userRole === "admin" && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="button sm secondary"
                          onClick={() => handleEdit(t)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="button sm danger"
                          onClick={() => handleDelete(t.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      No templates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}