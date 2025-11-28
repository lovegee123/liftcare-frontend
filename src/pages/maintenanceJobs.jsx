// src/pages/maintenanceJobs.jsx
import { useEffect, useState, useCallback } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyForm = {
  elevator_id: "",
  job_type: "emergency", // planned / emergency
  technician_id: "",
  contract_id: "",
  ticket_id: "",
  remarks: "",
  total_labor_hours: "",
  labor_cost: 0,
  parts_cost: "",
  parts_cost_with_markup: 0,
};

export default function MaintenanceJobs() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [jobs, setJobs] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [laborRate, setLaborRate] = useState(0);
  const [partsMarkupPercent, setPartsMarkupPercent] = useState(0);
  const [callFee, setCallFee] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // โหลดข้อมูลทั้งหมด
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      
      // Always load jobs, elevators, and contracts
      const apiCalls = [
        api.get("/api/maintenance/jobs"),
        api.get("/api/elevators"),
        api.get("/api/contracts"),
      ];
      
      // Only admins can load technicians and pricing settings
      if (userRole === "admin") {
        apiCalls.push(api.get("/api/technicians"));
        apiCalls.push(api.get("/api/pricing-settings"));
      }
      
      const results = await Promise.all(apiCalls);
      
      setJobs(results[0] || []);
      setElevators(results[1] || []);
      setContracts(results[2] || []);
      
      // Only set technicians and pricing settings if admin
      if (userRole === "admin") {
        setTechnicians(results[3] || []);
        const settings = results[4];
        setLaborRate(settings?.labor_rate_per_hour || 0);
        setPartsMarkupPercent(settings?.parts_markup_percent || 0);
        setCallFee(settings?.call_fee || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load maintenance jobs");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "total_labor_hours") {
      const hours = Number(value || 0);
      const cost = hours * laborRate;
      setForm((f) => ({ ...f, total_labor_hours: value, labor_cost: cost }));
    } else if (name === "parts_cost") {
      const baseCost = Number(value || 0);
      const markupAmount = baseCost * (partsMarkupPercent / 100);
      const totalPartsCost = baseCost + markupAmount;
      setForm((f) => ({ ...f, parts_cost: value, parts_cost_with_markup: totalPartsCost }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.elevator_id) {
      alert("กรุณาเลือกลิฟต์");
      return;
    }

    const labor = form.labor_cost ? Number(form.labor_cost) : 0;
    const parts = form.parts_cost_with_markup ? Number(form.parts_cost_with_markup) : 0;
    const total = labor + parts + callFee;

    const payload = {
      elevator_id: form.elevator_id,
      job_type: form.job_type || "emergency",
      technician_id: form.technician_id
        ? Number(form.technician_id)
        : null,
      contract_id: form.contract_id
        ? Number(form.contract_id)
        : null,
      ticket_id: form.ticket_id || null,
      remarks: form.remarks || null,
      total_labor_hours: form.total_labor_hours
        ? Number(form.total_labor_hours)
        : 0,
      labor_cost: labor,
      parts_cost: parts,
      call_fee: callFee,
      total_cost: total,
    };

    try {
      if (editingId) {
        await api.put(`/api/maintenance/jobs/${editingId}`, payload);
      } else {
        await api.post("/api/maintenance/jobs", payload);
      }
      setForm({ ...emptyForm, labor_cost: 0 });
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving maintenance job");
    }
  }

  function handleEdit(job) {
    const hours = Number(job.total_labor_hours || 0);
    const cost = hours * laborRate;
    const partsCostWithMarkup = Number(job.parts_cost || 0);
    // คำนวณ parts_cost ดิบจาก parts_cost_with_markup
    const baseParts = partsCostWithMarkup / (1 + partsMarkupPercent / 100);
    setEditingId(job.id);
    setForm({
      elevator_id: job.elevator_id || "",
      job_type: job.job_type || "emergency",
      technician_id:
        job.technician_id != null ? String(job.technician_id) : "",
      contract_id:
        job.contract_id != null ? String(job.contract_id) : "",
      ticket_id: job.ticket_id || "",
      remarks: job.remarks || "",
      total_labor_hours:
        job.total_labor_hours != null
          ? String(job.total_labor_hours)
          : "",
      labor_cost: cost,
      parts_cost: String(baseParts),
      parts_cost_with_markup: partsCostWithMarkup,
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบงานบำรุงนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/maintenance/jobs/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting job");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function elevatorLabel(eid) {
    const e = elevators.find((x) => x.id === eid);
    if (!e) return eid;
    return `${e.id} - ${e.name || ""}`;
  }

  function technicianName(tid) {
    const t = technicians.find((x) => x.id === tid);
    return t ? t.name : tid ? `#${tid}` : "-";
  }

  function contractCode(cid) {
    const c = contracts.find((x) => x.id === cid);
    return c ? c.contract_code : cid ? `#${cid}` : "-";
  }

  function renderJobType(type) {
    if (!type) return "-";
    if (type === "planned") return "Planned";
    if (type === "emergency") return "Emergency";
    return type;
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Maintenance Jobs</h2>
          <p className="app-page-subtitle">
            บันทึกและติดตามงานบำรุง / ซ่อมฉุกเฉินของลิฟต์แต่ละตัว
          </p>
        </div>

        {error && <div className="card error">{error}</div>}

        {/* ฟอร์มสร้าง / แก้ไขงาน - เฉพาะ admin */}
        {userRole === "admin" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {editingId ? "Edit Job" : "New Job"}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
            {/* Elevator / Type */}
            <div className="form-row">
              <div>
                <label>
                  Elevator *
                  <select
                    name="elevator_id"
                    value={form.elevator_id}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">-- select elevator --</option>
                    {elevators.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.id} - {e.name}{" "}
                        {e.building_name ? `(${e.building_name})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Job Type
                  <select
                    name="job_type"
                    value={form.job_type}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="planned">Planned</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Technician / Contract */}
            <div className="form-row">
              <div>
                <label>
                  Technician
                  <select
                    name="technician_id"
                    value={form.technician_id}
                    onChange={handleChange}
                    className="input"
                    disabled={technicians.length === 0}
                  >
                    <option value="">-- not assigned --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
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
                        {c.contract_code} - {c.customer_name || ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Ticket ID */}
            <label>
              Ticket ID
              <input
                name="ticket_id"
                value={form.ticket_id}
                onChange={handleChange}
                className="input"
                placeholder="เชื่อมกับ ticket ถ้ามี"
              />
            </label>

            {/* Remarks */}
            <label>
              Remarks
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="input"
                rows={2}
                placeholder="รายละเอียดอาการ / งานที่ทำ"
              />
            </label>

            {/* เวลาและค่าใช้จ่าย */}
            <div className="form-row">
              <div>
                <label>Call Fee (ค่าเรียกช่าง)</label>
                <input
                  type="number"
                  name="call_fee"
                  value={callFee}
                  className="input"
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>
                  Labor Hours
                  <input
                    type="number"
                    step="0.25"
                    name="total_labor_hours"
                    value={form.total_labor_hours}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>Labor Cost</label>
                <input
                  type="number"
                  name="labor_cost"
                  value={Number(form.labor_cost || 0).toFixed(2)}
                  className="input"
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>
                  Parts Cost (Raw)
                  <input
                    type="number"
                    step="0.01"
                    name="parts_cost"
                    value={form.parts_cost}
                    onChange={handleChange}
                    className="input"
                    placeholder="ค่าอะไหล่เบื้องต้น"
                  />
                </label>
              </div>
              <div>
                <label>Parts Cost (with {partsMarkupPercent}% Markup)</label>
                <input
                  type="number"
                  name="parts_cost_with_markup"
                  value={Number(form.parts_cost_with_markup || 0).toFixed(2)}
                  className="input"
                  disabled
                />
              </div>
            </div>

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

        {/* ตารางรายการงานบำรุง */}
        {loading && <div className="card">Loading jobs...</div>}

        {!loading && !error && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Jobs List</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Elevator</th>
                  <th>Technician</th>
                  <th>Type</th>
                  <th>Contract</th>
                  <th>Total Cost</th>
                  <th>Created</th>
                  {userRole === "admin" && <th style={{ width: 130 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>{j.id}</td>
                    <td>
                      {j.elevator_id}{" "}
                      {j.elevator_name ? `- ${j.elevator_name}` : ""}{" "}
                      {j.building_name ? `(${j.building_name})` : ""}
                    </td>
                    <td>{j.technician_name || technicianName(j.technician_id)}</td>
                    <td>{renderJobType(j.job_type)}</td>
                    <td>{j.contract_code || contractCode(j.contract_id)}</td>
                    <td>{(Number(j.labor_cost || 0) + Number(j.parts_cost || 0) + Number(callFee || 0)).toFixed(2)}</td>
                    <td>
                      {j.created_at
                        ? new Date(j.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    {userRole === "admin" && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="button sm secondary"
                          onClick={() => handleEdit(j)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="button sm danger"
                          onClick={() => handleDelete(j.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      No jobs.
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