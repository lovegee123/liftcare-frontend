// src/pages/login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApi } from "../api";
import { useAuth } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const api = useApi();
  const { login, isAuthed } = useAuth();
  const nav = useNavigate();

  // ถ้า login แล้วอยู่แล้ว ให้เด้งไปหน้า Dashboard ทันที
  useEffect(() => {
    if (isAuthed) nav("/");
  }, [isAuthed, nav]);

  const onSubmit = async (e) => {
  e.preventDefault();
  setMsg("");

  try {
    const data = await api.post("/auth/login", { email, password });
    // ✅ ต้องส่งเป็น object
    login({ token: data.token, user: data.user });
    nav("/");
  } catch (err) {
    console.error(err);
    setMsg("เข้าสู่ระบบไม่สำเร็จ");
  }
};


  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* ฝั่งซ้าย: Hero / Elevator theme */}
        <div style={styles.hero}>
          <div style={styles.heroOverlay} />

          <div style={styles.heroContent}>
            <div style={styles.logoBadge}>LiftCare</div>
            <h1 style={styles.heroTitle}>ระบบดูแลลิฟต์แบบครบวงจร</h1>
            <p style={styles.heroText}>
              ติดตามสถานะลิฟต์ แจ้งเตือนงานซ่อมบำรุง และดูสรุปการใช้งานได้จากที่เดียว
              เพื่อความปลอดภัยและความอุ่นใจของทุกอาคาร
            </p>

            <ul style={styles.heroList}>
              <li>แสดงสถานะลิฟต์และแจ้งเตือนปัญหาแบบเรียลไทม์</li>
              <li>จัดการใบงานบำรุงรักษาและประวัติการซ่อม</li>
              <li>รองรับทั้งเจ้าของอาคาร ผู้ดูแล และช่างเทคนิค</li>
            </ul>
          </div>

          {/* กล่องลิฟต์จำลอง */}
          <div style={styles.elevatorContainer}>
            <div style={styles.elevatorShaft}>
              <div style={styles.elevatorCar}>
                <div style={styles.elevatorLight} />
                <div style={styles.elevatorLabel}>LIFT A</div>
              </div>
            </div>
            <div style={styles.elevatorFloors}>
              <span>12</span>
              <span>9</span>
              <span>5</span>
              <span>G</span>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: ฟอร์มเข้าสู่ระบบ */}
        <div style={styles.formSide}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>เข้าสู่ระบบผู้ใช้งาน</h2>
            <p style={styles.formSubtitle}>
              กรุณาเข้าสู่ระบบด้วยบัญชี LiftCare ของคุณ
            </p>

            {msg && <div style={styles.errorBox}>{msg}</div>}

            <form onSubmit={onSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>อีเมล</label>
                <input
                  type="email"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>รหัสผ่าน</label>
                <input
                  type="password"
                  style={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน"
                />
              </div>

              <button type="submit" style={styles.btn}>
                เข้าสู่ระบบ
              </button>
            </form>

            <p style={styles.metaText}>
              ยังไม่มีบัญชี?{" "}
              <Link to="/register" style={styles.link}>
                สมัครใช้งาน LiftCare
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ใช้โทนสีเดียวกับเว็บจาก App.css
const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #004080 0, #003366 45%, #001a33 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 1040,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
    border: "1px solid rgba(148,163,184,0.4)",
    backdropFilter: "blur(10px)",
  },

  // Hero / Elevator Theme
  hero: {
    position: "relative",
    padding: 28,
    background:
      "linear-gradient(145deg, #001a33 0%, #003366 40%, #004080 100%)",
    color: "#e5e7eb",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(255,255,255,0.12), transparent 55%)",
    opacity: 0.9,
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: 420,
    display: "grid",
    gap: 12,
  },
  logoBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.75)",
    border: "1px solid rgba(148,163,184,0.6)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.04,
  },
  heroTitle: {
    margin: "8px 0 0",
    fontSize: 26,
    fontWeight: 700,
  },
  heroText: {
    margin: "4px 0 0",
    fontSize: 13.5,
    color: "#cbd5f5",
  },
  heroList: {
    margin: "8px 0 0",
    paddingLeft: 18,
    fontSize: 13,
    color: "#d1d5db",
    lineHeight: 1.5,
  },

  elevatorContainer: {
    position: "relative",
    zIndex: 1,
    marginTop: 18,
    display: "flex",
    alignItems: "flex-end",
    gap: 16,
  },
  elevatorShaft: {
    position: "relative",
    width: 80,
    height: 140,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.8)",
    background:
      "linear-gradient(to bottom, rgba(15,23,42,0.9), rgba(30,64,175,0.8))",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: 10,
    overflow: "hidden",
    boxShadow: "0 10px 22px rgba(15,23,42,0.8)",
  },
  elevatorCar: {
    width: 54,
    height: 56,
    borderRadius: 12,
    background: "linear-gradient(135deg, #e5e7eb, #9ca3af)",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    placeItems: "center",
    boxShadow: "0 4px 10px rgba(15,23,42,0.6)",
  },
  elevatorLight: {
    marginTop: 6,
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 10px rgba(34,197,94,0.9)",
  },
  elevatorLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
  },
  elevatorFloors: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 11,
    color: "#e5e7eb",
    opacity: 0.9,
  },

  // Form side
  formSide: {
    background: "#f2f4f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  formCard: {
    width: "100%",
    maxWidth: 380,
    background: "#ffffff",
    borderRadius: 18,
    boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
    padding: 22,
    display: "grid",
    gap: 14,
  },
  formTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#111827",
  },
  formSubtitle: {
    margin: 0,
    fontSize: 13,
    color: "#6b7280",
  },
  errorBox: {
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#ffe6e6",
    border: "1px solid #fca5a5",
    color: "#991b1b",
  },
  form: {
    display: "grid",
    gap: 12,
    marginTop: 4,
  },
  field: {
    display: "grid",
    gap: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    height: 42,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    transition: "all 0.2s ease",
    outline: "none",
  },
  btn: {
    marginTop: 4,
    height: 44,
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(0,51,102,0.45)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  metaText: {
    fontSize: 12.5,
    color: "#6b7280",
    margin: 0,
    marginTop: 6,
  },
  link: {
    color: "#003366",
    fontWeight: 600,
    textDecoration: "none",
  },
};
