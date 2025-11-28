// src/pages/AccountPage.jsx
import { useAuth } from "../auth";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>👤 ข้อมูลบัญชี</h2>
        <p style={styles.muted}>ข้อมูลผู้ใช้งานในระบบ LiftCare</p>

        <div style={styles.row}>
          <span style={styles.label}>ชื่อผู้ใช้</span>
          <span>{user?.name || "-"}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>อีเมล</span>
          <span>{user?.email || "-"}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>สิทธิ์การใช้งาน (Role)</span>
          <span>{user?.role || "-"}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 16,
  },
  card: {
    maxWidth: 520,
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,.08)",
  },
  title: { margin: 0, fontSize: 20 },
  muted: { margin: "4px 0 16px", color: "#6b7280", fontSize: 13 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
  },
  label: { color: "#6b7280" },
};
