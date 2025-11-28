// src/components/TicketModal.jsx
import { useState } from "react";
import { useApi } from "../api";

export default function TicketModal({ elevators, onClose, onCreated }) {
  const api = useApi();
  const [elevatorId, setElevatorId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!elevatorId) {
      setMsg("กรุณาเลือกลิฟต์ที่จะสร้างใบแจ้งซ่อม");
      return;
    }
    if (!desc.trim()) {
      setMsg("กรุณากรอกรายละเอียดปัญหา");
      return;
    }

    try {
      setCreating(true);
      await api.post("/api/tickets", {
        elevatorId,
        description: desc,
        title: title || null,
        priority,
      });

      // แจ้งให้หน้า Main รู้ว่า create เสร็จแล้ว (ไป reload dashboard ต่อ)
      if (onCreated) onCreated();

    } catch (err) {
      console.error(err);
      setMsg("สร้างใบแจ้งซ่อมไม่สำเร็จ: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  // กันคลิกพื้นหลังแล้วฟอร์มหาย
  function handleOverlayClick() {
    if (!creating) onClose();
  }

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>สร้างใบแจ้งซ่อมใหม่</h3>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            ลิฟต์
            <select
              style={styles.select}
              value={elevatorId}
              onChange={(e) => setElevatorId(e.target.value)}
            >
              <option value="">-- เลือกลิฟต์ --</option>
              {elevators.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.building_name || e.building_id})
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            หัวข้อ (ไม่จำเป็นต้องกรอก)
            <input
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ลิฟต์ค้างที่ชั้น 5"
            />
          </label>

          <label style={styles.label}>
            รายละเอียดปัญหา
            <textarea
              style={styles.textarea}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="อธิบายอาการ / สภาพหน้างาน"
            />
          </label>

          <label style={styles.label}>
            ความสำคัญ
            <select
              style={styles.select}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">ต่ำ</option>
              <option value="medium">ปกติ</option>
              <option value="high">สูง</option>
              <option value="critical">วิกฤต</option>
            </select>
          </label>

          {msg && <p style={styles.msg}>{msg}</p>}

          <div style={styles.footer}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={onClose}
              disabled={creating}
            >
              ยกเลิก
            </button>
            <button style={styles.submitBtn} type="submit" disabled={creating}>
              {creating ? "กำลังสร้าง..." : "สร้างใบแจ้งซ่อม"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
  },
  modal: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,.15)",
  },
  form: {
    display: "grid",
    gap: 8,
    marginTop: 8,
  },
  label: {
    display: "grid",
    gap: 4,
    fontSize: 12,
    color: "#374151",
  },
  input: {
    height: 36,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: "0 10px",
    fontSize: 13,
  },
  select: {
    height: 36,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: "0 10px",
    fontSize: 13,
    background: "#fff",
  },
  textarea: {
    minHeight: 70,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: 10,
    fontSize: 13,
    resize: "vertical",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    height: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontSize: 13,
  },
  submitBtn: {
    height: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  msg: {
    margin: 0,
    fontSize: 12,
    color: "#6b7280",
  },
};
