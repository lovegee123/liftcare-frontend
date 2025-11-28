// src/pages/elevators.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyForm = {
  id: "",
  name: "",
  building_id: "",
  brand: "",
  model: "",
  install_year: "",
  install_location: "",
  capacity: "",
  state: "normal",
  last_maintenance_at: "",
};

export default function Elevators() {
  const api = useApi();
  const userRole = useRoleCheck();
  const [elevators, setElevators] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [es, bs] = await Promise.all([
        api.get("/api/elevators"),
        api.get("/api/buildings"),
      ]);
      setElevators(es || []);
      setBuildings(bs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load elevators");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.id && !editingId) {
      alert("กรุณากรอก Elevator ID");
      return;
    }
    if (!form.name || !form.building_id) {
      alert("กรุณากรอก Name และเลือก Building");
      return;
    }

    const payload = {
      id: editingId ? undefined : form.id, // เวลาแก้ไขไม่ต้องส่ง id
      name: form.name,
      building_id: Number(form.building_id),
      brand: form.brand || null,
      model: form.model || null,
      install_year: form.install_year || null,
      install_location: form.install_location || null,
      capacity: form.capacity || null,
      state: form.state || "normal",
      last_maintenance_at: form.last_maintenance_at || null,
    };

    try {
      if (editingId) {
        await api.put(`/api/elevators/${editingId}`, payload);
      } else {
        await api.post("/api/elevators", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving elevator");
    }
  }

  function handleEdit(elev) {
    setEditingId(elev.id);
    setForm({
      id: elev.id,
      name: elev.name || "",
      building_id: elev.building_id != null ? String(elev.building_id) : "",
      brand: elev.brand || "",
      model: elev.model || "",
      install_year: elev.install_year || "",
      install_location: elev.install_location || "",
      capacity: elev.capacity || "",
      state: elev.state || "normal",
      last_maintenance_at: elev.last_maintenance_at
        ? elev.last_maintenance_at.slice(0, 10)
        : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบลิฟต์นี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/elevators/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting elevator");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function buildingName(bid) {
    const b = buildings.find((x) => x.id === bid);
    return b ? b.name : `#${bid}`;
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "customer", "technician"]}>
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Elevators</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลลิฟต์ (อาคาร / ยี่ห้อ / รุ่น / ปีติดตั้ง / สถานะ)
          </p>
        </div>

        {/* ฟอร์มลิฟต์ - เฉพาะ admin */}
        {userRole === "admin" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {editingId ? "Edit Elevator" : "New Elevator"}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
            {/* Elevator ID เฉพาะตอนสร้างใหม่ */}
            {!editingId && (
              <label>
                Elevator ID *
                <input
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  className="input"
                  placeholder="เช่น E01"
                />
              </label>
            )}

            {/* Name + Building */}
            <div className="form-row">
              <div>
                <label>
                  Elevator Type *
                  <select
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">-- เลือกประเภทลิฟต์ --</option>
                    <option value="Home Elevator">ลิฟท์บ้าน (Home Elevator)</option>
                    <option value="Cargo Lift">ลิฟท์ยกของ (Cargo Lift)</option>
                    <option value="Passenger Elevator">ลิฟท์โดยสาร (Passenger Elevator)</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Building *
                  <select
                    name="building_id"
                    value={form.building_id}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">-- select building --</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (ID: {b.id})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Brand / Model */}
            <div className="form-row">
              <div>
                <label>
                  Brand
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Model
                  <input
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* Install Year / Capacity */}
            <div className="form-row">
              <div>
                <label>
                  Install Year
                  <input
                    type="number"
                    name="install_year"
                    value={form.install_year}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Capacity (kg)
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* Install location */}
            <label>
              Install Location
              <input
                name="install_location"
                value={form.install_location}
                onChange={handleChange}
                className="input"
              />
            </label>

            {/* State */}
            <label>
              State
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="input"
              >
                <option value="normal">Normal</option>
                <option value="fault">Fault</option>
                <option value="in_maintenance">In Maintenance</option>
                <option value="waiting_maintenance">Waiting Maintenance</option>
                <option value="waiting_quotation">Waiting Quotation</option>
              </select>
            </label>

            {/* วันที่บำรุงล่าสุด */}
            <label>
              Last Maintenance
              <input
                type="date"
                name="last_maintenance_at"
                value={form.last_maintenance_at}
                onChange={handleChange}
                className="input"
              />
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
        )}

        {/* Error / Table */}
        {error && <div className="card error">{error}</div>}

        {!loading && !error && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Elevator List</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Elevator Type</th>
                  <th>Building</th>
                  <th>Brand/Model</th>
                  <th>State</th>
                  {userRole === "admin" && <th style={{ width: 140 }} />}
                </tr>
              </thead>
              <tbody>
                {elevators.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.name}</td>
                    <td>{e.building_name || buildingName(e.building_id)}</td>
                    <td>
                      {e.brand} {e.model}
                    </td>
                    <td>{e.state}</td>
                    {userRole === "admin" && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="button sm secondary"
                          type="button"
                          onClick={() => handleEdit(e)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          className="button sm danger"
                          type="button"
                          onClick={() => handleDelete(e.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {elevators.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No elevators.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {loading && <div className="card">Loading elevators...</div>}
      </div>
    </ProtectedPage>
  );
}