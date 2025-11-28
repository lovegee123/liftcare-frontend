// src/pages/maintenancePlans.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyForm = {
  elevator_id: "",
  contract_id: "",
  template_id: "",
  frequency_per_year: "4",
  next_run_at: "",
  is_active: true,
};

export default function MaintenancePlans() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [plans, setPlans] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // [New] State สำหรับเก็บข้อมูลสัญญาที่ถูกเลือกเพื่อแสดงผล
  const [selectedContractInfo, setSelectedContractInfo] = useState(null);

  async function loadAll() {
    try {
      setLoading(true);

      const [e, c, t, p] = await Promise.all([
        api.get("/api/elevators"),
        api.get("/api/contracts"),
        api.get("/api/maintenance/templates"),
        api.get("/api/maintenance/plans"),
      ]);

      setElevators(e);
      setContracts(c);
      setTemplates(t);
      setPlans(p);
    } catch (err) {
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // [New] ฟังก์ชันหาข้อมูลสัญญาจาก ID
  function findContractDetails(contractId) {
    //
    if (!contractId) return null;
    // ใช้ String(c.id) เพื่อให้แน่ใจว่าเปรียบเทียบได้ถูกต้อง
    return contracts.find((c) => String(c.id) === String(contractId));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    // ถ้าเลือก elevator ให้ดึงค่า next_maintenance_at และ contract_id จาก elevator
    if (name === "elevator_id" && value) {
      const selectedElevator = elevators.find((e) => e.id === value);
      // สมมติว่าข้อมูล Elevator มี contract_id ผูกอยู่ด้วย
      const contractId = selectedElevator?.contract_id || "";

      const contractDetails = findContractDetails(contractId);
      setSelectedContractInfo(contractDetails); //

      // Logic: กำหนด Frequency ตามสัญญา หรือตั้งเป็น 0 สำหรับ Per Call
      let newFrequency = form.frequency_per_year;
      if (contractDetails && contractDetails.contract_type === "per_call") {
        newFrequency = "0";
      } else if (
        contractDetails &&
        contractDetails.maintenance_times_per_year
      ) {
        newFrequency = String(contractDetails.maintenance_times_per_year);
      } else {
        newFrequency = "4";
      }

      setForm((f) => ({
        ...f,
        elevator_id: value,
        contract_id: contractId,
        frequency_per_year: newFrequency, // กำหนดค่า Frequency
        next_run_at: selectedElevator?.next_maintenance_at
          ? selectedElevator.next_maintenance_at.slice(0, 10)
          : "",
      }));
    } else if (name === "contract_id") {
      // [New] จัดการเมื่อผู้ใช้เปลี่ยน Contract ด้วยตนเอง
      const contractDetails = findContractDetails(value);
      setSelectedContractInfo(contractDetails); //

      let newFrequency = form.frequency_per_year;
      if (contractDetails && contractDetails.contract_type === "per_call") {
        newFrequency = "0";
      } else if (
        contractDetails &&
        contractDetails.maintenance_times_per_year
      ) {
        newFrequency = String(contractDetails.maintenance_times_per_year);
      } else {
        newFrequency = "4";
      }

      setForm((f) => ({
        ...f,
        [name]: value,
        frequency_per_year: newFrequency, // กำหนดค่า Frequency
      }));
    } else {
      setForm((f) => ({
        ...f,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.elevator_id || !form.template_id) {
      alert("กรุณาเลือกลิฟต์ และ Template");
      return;
    }

    const payload = {
      elevator_id: form.elevator_id,
      contract_id: form.contract_id || null,
      template_id: form.template_id,
      frequency_per_year: Number(form.frequency_per_year),
      next_run_at: form.next_run_at || null,
      is_active: form.is_active ? 1 : 0,
    };

    try {
      if (editingId) {
        await api.put(`/api/maintenance/plans/${editingId}`, payload);
      } else {
        await api.post("/api/maintenance/plans", payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadAll();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  function handleEdit(plan) {
    setEditingId(plan.id);
    // ... (logic to find elevator and nextMaintenance)
    const elevator = elevators.find((e) => e.id === plan.elevator_id); //
    const nextMaintenance = elevator?.next_maintenance_at //
      ? elevator.next_maintenance_at.slice(0, 10) //
      : plan.next_run_at
      ? plan.next_run_at.slice(0, 10)
      : "";

    // [New] ดึงข้อมูล Contract มาแสดงผลเมื่อเข้าโหมด Edit
    const contractDetails = contracts.find((c) => c.id === plan.contract_id); //
    setSelectedContractInfo(contractDetails || null);

    setForm({
      elevator_id: plan.elevator_id,
      contract_id: plan.contract_id || "",
      template_id: plan.template_id,
      frequency_per_year: String(plan.frequency_per_year || 4),
      next_run_at: nextMaintenance,
      is_active: !!plan.is_active,
    });
  }

  async function handleDelete(planId) {
    if (!window.confirm("ต้องการลบ Maintenance Plan นี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/maintenance/plans/${planId}`);
      await loadAll();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  // [New] ตัวแปรช่วยตรวจสอบว่าเป็น Per Call หรือไม่
  const isPerCall = selectedContractInfo?.contract_type === "per_call";

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Maintenance Plans</h2>
          <p className="app-page-subtitle">
            ตั้งรอบ PM ให้แต่ละลิฟต์ตามสัญญาและ Template
          </p>
        </div>

        {/* ฟอร์ม - เฉพาะ admin */}
        {userRole === "admin" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {editingId ? "Edit Plan" : "New Plan"}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Elevator */}
              <label>
                Elevator *
                <select
                  name="elevator_id"
                  value={form.elevator_id}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">-- Select elevator --</option>
                  {elevators.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} - {e.name} ({e.building_name})
                    </option>
                  ))}
                </select>
              </label>

              {/* NEW: Display associated contract details */}
              {selectedContractInfo && (
                <div
                  className={`card-info ${isPerCall ? "danger" : "info"}`}
                  style={{
                    marginBottom: 16,
                    border: "1px solid #ccc",
                    padding: "10px",
                    borderRadius: "4px",
                    backgroundColor: isPerCall ? "#fff3f3" : "#f0f8ff",
                  }}
                >
                  <p>
                    <strong>Associated Contract:</strong>{" "}
                    {selectedContractInfo.contract_code} (
                    {selectedContractInfo.customer_name})
                  </p>
                  <p>
                    <strong>Type:</strong>{" "}
                    {isPerCall
                      ? "Per Call (จ่ายต่อครั้ง) 🟡"
                      : "Annual (รายปี) 🟢"}
                  </p>
                  {isPerCall ? (
                    <p style={{ color: "red", fontWeight: "bold" }}>
                      ⚠️ This is a Per Call contract. The **Maintenance plan**
                      (frequency and next run) are not required and should be
                      managed manually through maintenance jobs.
                    </p>
                  ) : (
                    <p>
                      <strong>Contract Frequency:</strong>{" "}
                      {selectedContractInfo.maintenance_times_per_year || "N/A"}{" "}
                      times/year
                    </p>
                  )}
                  <p>
                    <strong>Period:</strong>{" "}
                    {selectedContractInfo.start_date.slice(0, 10)} -{" "}
                    {selectedContractInfo.end_date.slice(0, 10)}
                  </p>
                </div>
              )}

              {/* Contract + Template */}
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
                      <option value="">-- None --</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.contract_code} - {c.customer_name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label>
                    Template *
                    <select
                      name="template_id"
                      value={form.template_id}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">-- Select template --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Frequency / next run */}
              <div className="form-row">
                <div>
                  <label>
                    {/* Change label based on Per Call */}
                    Frequency per year {!isPerCall && "*"}
                    <input
                      type="number"
                      name="frequency_per_year"
                      value={form.frequency_per_year}
                      onChange={handleChange}
                      className="input"
                      min={0}
                      // Disable frequency input if Per Call contract is active
                      disabled={isPerCall}
                      title={
                        isPerCall
                          ? "Frequency is 0 for Per Call contracts"
                          : "Enter frequency"
                      }
                    />
                    {isPerCall && (
                      <small
                        style={{
                          display: "block",
                          marginTop: "4px",
                          color: "red",
                        }}
                      >
                        (Frequency set to 0 for Per Call contract)
                      </small>
                    )}
                  </label>
                </div>

                {/* [Revised] ซ่อนช่อง Next maintenance ถ้าเป็น Per Call */}
                {!isPerCall && (
                  <div>
                    <label>
                      Next maintenance
                      <input
                        type="date"
                        name="next_run_at"
                        value={form.next_run_at}
                        onChange={handleChange}
                        className="input"
                        disabled={!form.elevator_id}
                        title={!form.elevator_id ? "กรุณาเลือกลิฟต์ก่อน" : ""}
                      />
                    </label>
                  </div>
                )}
                {isPerCall && (
                  <div>
                    <label>
                      Next maintenance
                      <input
                        type="text"
                        className="input"
                        value="N/A (Per Call Contract)"
                        disabled
                        style={{ fontStyle: "italic", color: "#6b7280" }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Active checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Active
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

        {/* ตาราง */}
        <div className="card">
          <div className="card-title">Maintenance Plan List</div>

          {loading && <div>Loading...</div>}
          {error && <div className="card error">{error}</div>}

          {!loading && !error && (
            <table className="table">
              <thead>
                <tr>
                  <th>Elevator</th>
                  <th>Template</th>
                  <th>Contract</th>
                  <th>Freq/Year</th>
                  <th>Next maintenance</th>
                  <th>Last run</th>
                  <th>Active</th>
                  {userRole === "admin" && (
                    <th style={{ width: 150 }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.elevator_id} - {p.elevator_name}{" "}
                      {p.building_name ? `(${p.building_name})` : ""}
                    </td>
                    <td>{p.template_name}</td>
                    <td>
                      {p.contract_code
                        ? `${p.contract_code} - ${p.customer_name || ""}`
                        : "-"}
                    </td>
                    <td>{p.frequency_per_year}</td>
                    <td>
                      {p.next_run_at
                        ? new Date(p.next_run_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {p.last_run_at
                        ? new Date(p.last_run_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{p.is_active ? "Yes" : "No"}</td>
                    {userRole === "admin" && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="button sm secondary"
                          onClick={() => handleEdit(p)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="button sm danger"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      No maintenance plans.
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
