// src/pages/buildings.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";
import FormModal from "../components/FormModal";

const emptyForm = {
  customer_id: "",
  name: "",
  address: "",
  building_type: "",
};

export default function Buildings() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [buildings, setBuildings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // โหลดข้อมูล buildings + customers
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [bs, cs] = await Promise.all([
        api.get("/api/buildings"),
        api.get("/api/customers"),
      ]);
      setBuildings(bs || []);
      setCustomers(cs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  }

  // handleChange: กรณีเปลี่ยน customer จะ auto-fill building name, address, และ building_type จาก customer
  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "customer_id") {
      setForm((f) => {
        const updated = { ...f, customer_id: value };

        const customer = customers.find((x) => x.id === Number(value));

      // Auto-fill ข้อมูลจาก customer
      if (customer) {
        // เปลี่ยน Building Name ตาม customer.name
        updated.name = customer.name || "";
        // ดึง address จาก customer.address
        updated.address = customer.address || "";
        // ดึง building_type จาก customer.business_type (ใช้เป็นค่าเริ่มต้น)
        updated.building_type = customer.business_type || "";
      } else if (!value) {
        // ถ้าเลือกเป็นค่าว่าง กลับมาเคลียร์ข้อมูลทั้งหมด
        updated.name = "";
        updated.address = "";
        updated.building_type = "";
      }

      return updated;
    });
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
    if (!form.name.trim()) {
      alert("กรุณากรอกชื่ออาคาร");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
      };

      if (editingId) {
        await api.put(`/api/buildings/${editingId}`, payload);
      } else {
        await api.post("/api/buildings", payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving building");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(b) {
    setEditingId(b.id);
    setForm({
      customer_id: b.customer_id?.toString() || "",
      name: b.name || "",
      address: b.address || "",
      building_type: b.building_type || "",
    });
    setIsFormOpen(true);
  }

  async function handleDelete(b) {
    if (!window.confirm(`ลบอาคาร "${b.name}" หรือไม่?`)) return;
    try {
      await api.delete(`/api/buildings/${b.id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting building");
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

  // label ที่ใช้แสดงใน dropdown / ตาราง (ไม่มีวงเล็บด้านหลัง)
  function customerLabel(c) {
    const contact = c.contact || c.contact_name || c.contact_person || "";
    if (contact) return contact; // แสดงชื่อ contact อย่างเดียว
    return c.name || `Customer #${c.id}`;
  }

  function customerName(id) {
    const c = customers.find((x) => x.id === Number(id));
    return c ? customerLabel(c) : "-";
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles="admin">
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Buildings</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลอาคารสำหรับลูกค้าแต่ละราย
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {/* ปุ่มสร้างใหม่ */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="button primary"
            onClick={handleOpenForm}
          >
            + Add New Building
          </button>
        </div>

        {/* Modal Form */}
        <FormModal
          isOpen={isFormOpen}
          title={editingId ? "Edit Building" : "New Building"}
          onClose={handleCloseForm}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div>
                <label>
                  Customer *
                  <select
                    name="customer_id"
                    className="input"
                    value={form.customer_id}
                    onChange={handleChange}
                  >
                    <option value="">-- เลือกลูกค้า / ผู้ติดต่อ --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {customerLabel(c)} {/* ไม่มีวงเล็บแล้ว */}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label>
                  Building Name *
                  <input
                    name="name"
                    className="input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="เช่น Tower A"
                  />
                </label>
              </div>
            </div>

            <label>
              Address
              <textarea
                name="address"
                className="input"
                rows={2}
                value={form.address}
                onChange={handleChange}
              />
            </label>

            <label>
              Building Type
              <input
                name="building_type"
                className="input"
                value={form.building_type}
                onChange={handleChange}
                placeholder="เช่น Office / Condo / Hospital"
              />
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="submit"
                className="button primary"
                disabled={saving}
              >
                {saving ? "Saving..." : editingId ? "Save" : "Create"}
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

        {/* ตารางรายการอาคาร */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Buildings</div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Building Name</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th style={{ width: 130 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{customerName(b.customer_id)}</td>
                    <td>{b.name}</td>
                    <td>{b.address}</td>
                    <td>{b.building_type}</td>
                    <td>
                      <button
                        type="button"
                        className="button sm secondary"
                        onClick={() => handleEdit(b)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="button sm danger"
                        onClick={() => handleDelete(b)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {buildings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No buildings.
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
