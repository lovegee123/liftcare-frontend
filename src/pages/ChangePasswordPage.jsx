// src/pages/ChangePasswordPage.jsx
import { useState } from "react";
import { useApi } from "../api";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const api = useApi();

  // เงื่อนไขว่าพร้อมให้กดปุ่มหรือยัง
  const isValid =
    current.trim().length > 0 &&
    next.trim().length >= 8 &&
    confirm.trim().length > 0 &&
    next === confirm;

  async function onSubmit(e) {
    e.preventDefault();
    // กันเผื่อผู้ใช้ force submit (เช่น กด Enter) ตอน invalid
    if (!isValid || loading) return;

    setMsg("");
    setLoading(true);

    try {
      // เรียก backend: /auth/change-password
      const res = await api.post("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      });

      setMsg(res?.message || "✅ เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      // เคลียร์ฟอร์มหลังทำสำเร็จ
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      console.error("Change password error:", err);
      setMsg(err.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div className="lift-card" style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>🔐 เปลี่ยนรหัสผ่าน</h2>
            <p style={styles.subtitle}>
              โปรดกำหนดรหัสผ่านใหม่เพื่อเพิ่มความปลอดภัยให้บัญชีของคุณ
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>รหัสผ่านปัจจุบัน</h3>

            <div style={styles.field}>
              <label style={styles.label}>รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                style={styles.input}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="กรอกรหัสผ่านเดิมของคุณ"
              />
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>รหัสผ่านใหม่</h3>

            <div style={styles.twoCols}>
              <div style={styles.field}>
                <label style={styles.label}>รหัสผ่านใหม่</label>
                <input
                  type="password"
                  style={styles.input}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร ผสมสัญลักษณ์"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  style={styles.input}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                />
              </div>
            </div>
          </section>

          <div style={styles.footerRow}>
            <button
              type="submit"
              style={{
                ...styles.saveBtn,
                ...(loading || !isValid ? styles.saveBtnDisabled : {}),
              }}
              disabled={loading || !isValid}
            >
              {loading ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนรหัสผ่าน"}
            </button>

            {msg && <p style={styles.msg}>{msg}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    maxWidth: 780,
    margin: "0 auto",
  },
  card: {
    display: "grid",
    gap: 20,
  },
  headerRow: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 12,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: 13.5 },
  section: {
    padding: 16,
    borderRadius: 12,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    display: "grid",
    gap: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
  },
  form: {
    display: "grid",
    gap: 20,
  },
  field: {
    display: "grid",
    gap: 6,
  },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    height: 42,
    padding: "0 14px",
    fontSize: 14,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    transition: "all 0.25s ease",
    outline: "none",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  twoCols: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
  footerRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  saveBtn: {
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 10,
    cursor: "pointer",
    color: "white",
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    boxShadow: "0 4px 12px rgba(30,64,175,0.25)",
    transition: "all 0.25s ease",
  },
  saveBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  msg: {
    fontSize: 13,
    color: "#6b7280",
  },
};
