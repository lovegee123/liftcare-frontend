// src/pages/technicians.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";
import { useAuth } from "../auth";
import FormModal from "../components/FormModal";

const emptyForm = {
  user_id: "",
  phone: "",
  specialty: "",
  notes: "",
};

const emptyRequestForm = {
  phone: "",
  specialty: "",
  notes: "",
  address: "",
  date_of_birth: "",
  age: "",
  experience: "",
  education: "",
};

export default function Technicians() {
  const api = useApi();
  const userRole = useRoleCheck();
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState([]);
  const [technicianRequests, setTechnicianRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewingRequestId, setViewingRequestId] = useState(null);
  const [isConfirmApproveOpen, setIsConfirmApproveOpen] = useState(false);
  const [confirmApproveRequestId, setConfirmApproveRequestId] = useState(null);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [confirmRejectRequestId, setConfirmRejectRequestId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      
      // ทั้ง admin และ technician ต้องโหลดข้อมูลช่างเพื่อตรวจสอบสถานะ
      const ts = await api.get("/api/technicians");
      setTechnicians(ts || []);
      
      // เฉพาะ admin ที่โหลด users และ requests
      if (userRole === "admin") {
        const [us, tr] = await Promise.all([
          api.get("/api/technician-users"),
          api.get("/api/technician-requests"),
        ]);
        setUsers(us || []);
        setTechnicianRequests(tr || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
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

  function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : "";
  }

  function handleRequestChange(e) {
    const { name, value } = e.target;
    
    // ถ้าเปลี่ยน date_of_birth ให้คำนวณอายุอัตโนมัติ
    if (name === "date_of_birth") {
      const calculatedAge = calculateAge(value);
      setRequestForm((f) => ({ 
        ...f, 
        [name]: value,
        age: calculatedAge
      }));
    } else {
      setRequestForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        phone: requestForm.phone,
        specialty: requestForm.specialty,
        address: requestForm.address,
        date_of_birth: requestForm.date_of_birth,
        age: requestForm.age,
        experience: requestForm.experience,
        education: requestForm.education,
        notes: requestForm.notes,
      };
      
      await api.post("/api/technician-requests", payload);
      alert("ส่งคำขอสมัครเป็นช่างเรียบร้อยแล้ว รอการอนุมัติจากผู้ดูแลระบบ");
      
      setRequestForm(emptyRequestForm);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error submitting request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.user_id) {
      alert("กรุณาเลือก User ที่เป็นช่าง");
      return;
    }

    const payload = {
      user_id: Number(form.user_id),
      phone: form.phone || null,
      specialty: form.specialty || null,
      notes: form.notes || null,
    };

    try {
      if (editingId) {
        await api.put(`/api/technicians/${editingId}`, payload);
      } else {
        await api.post("/api/technicians", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving technician");
    }
  }

  function handleEdit(t) {
    setEditingId(t.id);
    setForm({
      user_id: t.user_id,
      phone: t.phone || "",
      specialty: t.specialty || "",
      notes: t.notes || "",
    });
    setIsFormOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบช่างคนนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/technicians/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting technician");
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

  function renderUserName(user_id) {
    const u = users.find((x) => x.id === user_id);
    if (!u) return `User #${user_id}`;
    return `${u.name} (${u.email})`;
  }

  function handleOpenConfirmApprove(requestId) {
    setConfirmApproveRequestId(requestId);
    setIsConfirmApproveOpen(true);
  }

  function handleCloseConfirmApprove() {
    setIsConfirmApproveOpen(false);
    setConfirmApproveRequestId(null);
  }

  async function handleConfirmApprove() {
    if (!confirmApproveRequestId) return;
    
    try {
      await api.put(`/api/technician-requests/${confirmApproveRequestId}`, { status: "approved" });
      alert("ได้ทำการอนุมัติคำขอสมัคร และสร้างบันทึกช่างใหม่เรียบร้อยแล้ว");
      handleCloseConfirmApprove();
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error approving request");
    }
  }

  function handleOpenConfirmReject(requestId) {
    setConfirmRejectRequestId(requestId);
    setIsConfirmRejectOpen(true);
  }

  function handleCloseConfirmReject() {
    setIsConfirmRejectOpen(false);
    setConfirmRejectRequestId(null);
  }

  async function handleConfirmReject() {
    if (!confirmRejectRequestId) return;
    
    try {
      await api.put(`/api/technician-requests/${confirmRejectRequestId}`, { status: "rejected" });
      alert("ได้ทำการปฏิเสธคำขอสมัครเรียบร้อยแล้ว");
      handleCloseConfirmReject();
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error rejecting request");
    }
  }

  function handleViewRequest(requestId) {
    setViewingRequestId(requestId);
    setIsViewDetailsOpen(true);
  }

  function handleCloseViewDetails() {
    setIsViewDetailsOpen(false);
    setViewingRequestId(null);
  }

  // สำหรับ technician: แสดงฟอร์มขอสมัครหรือหน้า approved ตามสถานะ
  if (userRole === "technician") {
    // ตรวจสอบว่าช่างคนนี้มีข้อมูลใน Approved Technician List หรือไม่
    const isApproved = technicians.some(t => t.user_id === user?.id);

    if (isApproved) {
      // ถ้าได้อนุมัติแล้ว ให้ redirect ไปหน้า main หรือแสดงข้อความแล้วจบ
      return (
        <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
          <div>
            <div className="app-page-header">
              <h2 className="app-page-title">Technician Portal</h2>
              <p className="app-page-subtitle">
                ยินดีต้อนรับสู่ระบบช่าง คุณสามารถเข้าใช้งานเมนูต่าง ๆ ได้เรียบร้อยแล้ว
              </p>
            </div>

            <div className="card" style={{ backgroundColor: "#d1fae5", borderColor: "#10b981", borderWidth: "2px", padding: "20px", borderRadius: "8px" }}>
              <div style={{ color: "#065f46", fontSize: "16px" }}>
                <strong>✓ หมายเหตุ:</strong>
                <p style={{ marginTop: "8px", color: "#047857", lineHeight: "1.6" }}>
                  บัญชีของคุณได้รับการอนุมัติเรียบร้อยแล้ว และไม่สามารถเข้าหน้านี้ได้อีก กรุณาไปที่เมนู Maintenance, Parts หรือ Technician Portal เพื่อใช้งาน
                </p>
              </div>
            </div>
          </div>
        </ProtectedPage>
      );
    }

    // ถ้ายังไม่ได้อนุมัติ แสดงฟอร์มขอสมัคร
    return (
      <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
        <div>
          {/* Header */}
          <div className="app-page-header">
            <h2 className="app-page-title">New Technician Request</h2>
            <p className="app-page-subtitle">
              กรอกข้อมูลเพื่อสมัครเป็นช่างเทคนิคในระบบ
            </p>
          </div>

          {error && <div className="card error">{error}</div>}

          {/* ฟอร์มขอสมัคร */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">ข้อมูลการสมัครเป็นช่างเทคนิค</div>
            </div>

            <form onSubmit={handleSubmitRequest}>
              {/* User Info (Read-only) */}
              <label>
                ชื่อผู้ใช้งาน
                <input
                  type="text"
                  className="input"
                  value={`${user?.name || ""} (${user?.email || ""})`}
                  disabled
                  style={{ backgroundColor: "#f5f5f5", color: "#6b7280" }}
                />
              </label>

              {/* Phone + Specialty */}
              <div className="form-row">
                <div>
                  <label>
                    Phone *
                    <input
                      type="tel"
                      name="phone"
                      value={requestForm.phone}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="เช่น 081-234-5678"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Specialty (ความเชี่ยวชาญ) *
                    <input
                      name="specialty"
                      value={requestForm.specialty}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="เช่น Mitsubishi, Inverter, Rescue..."
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Address */}
              <label>
                Address *
                <textarea
                  name="address"
                  value={requestForm.address}
                  onChange={handleRequestChange}
                  className="input"
                  rows={2}
                  placeholder="ที่อยู่"
                  required
                />
              </label>

              {/* Date of Birth + Age */}
              <div className="form-row">
                <div>
                  <label>
                    Date of Birth *
                    <input
                      type="date"
                      name="date_of_birth"
                      value={requestForm.date_of_birth}
                      onChange={handleRequestChange}
                      className="input"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Age *
                    <input
                      type="number"
                      name="age"
                      value={requestForm.age}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="คำนวณอัตโนมัติจาก Date of Birth"
                      min={18}
                      max={100}
                      disabled
                      readOnly
                      required
                      style={{ backgroundColor: "#f5f5f5", color: "#6b7280", cursor: "not-allowed" }}
                    />
                  </label>
                </div>
              </div>

              {/* Experience + Education */}
              <div className="form-row">
                <div>
                  <label>
                    ประสบการณ์ทำงาน (ปี) *
                    <input
                      type="number"
                      name="experience"
                      value={requestForm.experience}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="จำนวนปี"
                      min={0}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    วุฒิการศึกษา *
                    <input
                      name="education"
                      value={requestForm.education}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="เช่น ปวช., ปวส., ปริญญาตรี..."
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Notes */}
              <label>
                Notes
                <textarea
                  name="notes"
                  value={requestForm.notes}
                  onChange={handleRequestChange}
                  className="input"
                  rows={3}
                  placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"
                />
              </label>

              {/* Submit Button */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  type="submit"
                  className="button primary"
                  disabled={submitting}
                >
                  {submitting ? "กำลังส่ง..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  // สำหรับ admin: แสดงหน้าจัดการช่างแบบเดิม
  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* Header */}
        <div className="app-page-header">
          <h2 className="app-page-title">Technicians</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลช่างเทคนิค และเชื่อมกับ User ของระบบ
          </p>
        </div>

        {error && <div className="card error">{error}</div>}

        {/* Pending Technician Requests */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-header">
            <div className="card-title">Pending Technician Requests</div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : technicianRequests.filter(r => r.status === 'pending').length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Specialty</th>
                  <th>Experience</th>
                  <th style={{ width: 300 }} />
                </tr>
              </thead>
              <tbody>
                {technicianRequests
                  .filter(r => r.status === 'pending')
                  .map((req) => (
                    <tr key={req.id}>
                      <td>{req.name || "-"}</td>
                      <td>{req.email || "-"}</td>
                      <td>{req.phone || "-"}</td>
                      <td>{req.specialty || "-"}</td>
                      <td>{req.experience || "-"} years</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "nowrap" }}>
                          <button
                            className="button sm secondary"
                            type="button"
                            onClick={() => handleViewRequest(req.id)}
                          >
                            View Details
                          </button>
                          <button
                            className="button sm primary"
                            type="button"
                            onClick={() => handleOpenConfirmApprove(req.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="button sm danger"
                            type="button"
                            onClick={() => handleOpenConfirmReject(req.id)}
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#6b7280" }}>
              No pending requests
            </div>
          )}
        </div>

        {/* ฟอร์มในโมดัล */}
        <FormModal
          isOpen={isFormOpen}
          title={editingId ? "Edit Technician" : "New Technician"}
          onClose={handleCloseForm}
        >
          <form onSubmit={handleSubmit}>
            <label>
              User (Technician) *
              <select
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                className="input"
                disabled={!!editingId} // แก้ไขห้ามเปลี่ยน user_id (เหมือนของเดิม)
              >
                <option value="">-- select user --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <div>
                <label>
                  Phone
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Specialty (ความเชี่ยวชาญ)
                  <input
                    name="specialty"
                    value={form.specialty}
                    onChange={handleChange}
                    className="input"
                    placeholder="เช่น Mitsubishi, Inverter, Rescue..."
                  />
                </label>
              </div>
            </div>

            <label>
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="input"
                rows={3}
              />
            </label>

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

        {/* Modal View Details */}
        <FormModal
          isOpen={isViewDetailsOpen}
          title="Applicant Details"
          onClose={handleCloseViewDetails}
        >
          {viewingRequestId && technicianRequests.find(r => r.id === viewingRequestId) ? (
            <div style={{ lineHeight: 1.8 }}>
              {(() => {
                const req = technicianRequests.find(r => r.id === viewingRequestId);
                return (
                  <>
                    <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>ข้อมูลผู้สมัคร</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>ชื่อ:</span> {req.name || "-"}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>อีเมล:</span> {req.email || "-"}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>เบอรโทร:</span> {req.phone || "-"}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>ความเชี่ยวชาญ:</span> {req.specialty || "-"}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>ที่อยู่:</span> {req.address || "-"}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>วันเกิด:</span> {req.date_of_birth ? new Date(req.date_of_birth).toLocaleDateString("th-TH") : "-"}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>อายุ:</span> {req.age || "-"} ปี
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>ประสบการณ์:</span> {req.experience || "-"} ปี
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>วุฒิการศึกษา:</span> {req.education || "-"}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 500, color: "#6b7280" }}>หมายเหตุ:</span> {req.notes || "-"}
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb", color: "#9ca3af", fontSize: 12 }}>
                      ส่งคำขอเมื่อ: {new Date(req.created_at).toLocaleString("th-TH")}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : null}
        </FormModal>

        {/* Modal Confirm Approve */}
        <FormModal
          isOpen={isConfirmApproveOpen}
          title="ยืนยันการอนุมัติ"
          onClose={handleCloseConfirmApprove}
        >
          {confirmApproveRequestId && technicianRequests.find(r => r.id === confirmApproveRequestId) ? (
            <div>
              {(() => {
                const req = technicianRequests.find(r => r.id === confirmApproveRequestId);
                return (
                  <>
                    <div style={{ marginBottom: 16, color: "#374151" }}>
                      <p>คุณต้องการอนุมัติคำขอสมัครของ <strong>{req.name}</strong> ใช่หรือไม่?</p>
                      <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
                        ระบบจะสร้างบันทึกช่างใหม่พร้อมข้อมูลที่ส่งมา
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={handleCloseConfirmApprove}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="button primary"
                        onClick={handleConfirmApprove}
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : null}
        </FormModal>

        {/* Modal Confirm Reject */}
        <FormModal
          isOpen={isConfirmRejectOpen}
          title="ยืนยันการปฏิเสธ"
          onClose={handleCloseConfirmReject}
        >
          {confirmRejectRequestId && technicianRequests.find(r => r.id === confirmRejectRequestId) ? (
            <div>
              {(() => {
                const req = technicianRequests.find(r => r.id === confirmRejectRequestId);
                return (
                  <>
                    <div style={{ marginBottom: 16, color: "#374151" }}>
                      <p>คุณต้องการปฏิเสธคำขอสมัครของ <strong>{req.name}</strong> ใช่หรือไม่?</p>
                      <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
                        
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={handleCloseConfirmReject}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className="button danger"
                        onClick={handleConfirmReject}
                      >
                        ยืนยันการปฏิเสธ
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : null}
        </FormModal>

        {/* ตาราง */}
        <div className="card">
          <div className="card-title">Approved Technician List</div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Specialty</th>
                  <th>Experience</th>
                  <th>Education</th>
                  <th style={{ width: 140 }} />
                </tr>
              </thead>
              <tbody>
                {technicians.map((t) => (
                  <tr key={t.id}>
                    <td>{renderUserName(t.user_id)}</td>
                    <td>{t.phone || "-"}</td>
                    <td>{t.specialty || "-"}</td>
                    <td>{t.experience || "-"} ปี</td>
                    <td>{t.education || "-"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="button sm secondary"
                        type="button"
                        onClick={() => handleEdit(t)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        className="button sm danger"
                        type="button"
                        onClick={() => handleDelete(t.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {technicians.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No technicians.
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