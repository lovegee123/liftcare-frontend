// src/pages/register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApi } from "../api";
import { useAuth } from "../auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [msg, setMsg] = useState("");
  const api = useApi();
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });
      // สมัครเสร็จ ล็อกอินให้เลย
      if (res.token && res.user) {
        login(res.token, res.user);
        nav("/");
      } else {
        setMsg("สมัครสมาชิกสำเร็จ แต่ไม่พบ token สำหรับเข้าสู่ระบบ");
      }
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* ฝั่งซ้าย: Hero เดิม */}
        <div style={styles.hero}>
          <div style={styles.heroOverlay} />

          <div style={styles.heroContent}>
            <div style={styles.logoBadge}>LiftCare</div>
            <h1 style={styles.heroTitle}>สร้างบัญชี LiftCare</h1>
            <p style={styles.heroText}>
              ลงทะเบียนเพื่อเริ่มต้นจัดการลิฟต์ งานบำรุงรักษา และข้อมูลสัญญาในที่เดียว
            </p>

            <ul style={styles.heroList}>
              <li>รวมข้อมูลลิฟต์ทุกตัวในระบบเดียว</li>
              <li>ช่วยวางแผน Preventive maintenance ล่วงหน้า</li>
              <li>ดูสรุปงานซ่อม ค่าใช้จ่าย และสถานะใบงานได้ทันที</li>
            </ul>
          </div>

          <div style={styles.elevatorContainer}>
            <div style={styles.elevatorShaft}>
              <div style={styles.elevatorCar}>
                <div style={styles.elevatorLight} />
                <div style={styles.elevatorLabel}>LIFT B</div>
              </div>
            </div>
            <div style={styles.elevatorFloors}>
              <span>PH</span>
              <span>10</span>
              <span>7</span>
              <span>G</span>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: ฟอร์มสมัครใช้งาน */}
        <div style={styles.formSide}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>สมัครใช้งาน LiftCare</h2>
            <p style={styles.formSubtitle}>
              กรอกข้อมูลเบื้องต้นเพื่อสร้างบัญชีสำหรับเข้าใช้งานระบบ
            </p>

            {msg && <div style={styles.errorBox}>{msg}</div>}

            <form onSubmit={onSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>ชื่อผู้ใช้งาน / ชื่อองค์กร</label>
                <input
                  type="text"
                  style={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ผู้ดูแลอาคาร A หรือ บริษัท XX"
                />
              </div>

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
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>ประเภทผู้ใช้งาน</label>
                <div style={styles.roleContainer}>
                  <label
                    style={{
                      ...styles.roleOption,
                      ...(role === "customer" ? styles.roleOptionSelected : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="customer"
                      checked={role === "customer"}
                      onChange={(e) => setRole(e.target.value)}
                      style={styles.radio}
                    />
                    <span style={styles.roleLabel}>ลูกค้า (Customer)</span>
                  </label>
                  <label
                    style={{
                      ...styles.roleOption,
                      ...(role === "technician" ? styles.roleOptionSelected : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="technician"
                      checked={role === "technician"}
                      onChange={(e) => setRole(e.target.value)}
                      style={styles.radio}
                    />
                    <span style={styles.roleLabel}>ช่าง (Technician)</span>
                  </label>
                </div>
              </div>

              <button type="submit" style={styles.btn}>
                สร้างบัญชีใหม่
              </button>
            </form>

            <p style={styles.metaText}>
              มีบัญชีอยู่แล้ว?{" "}
              <Link to="/login" style={styles.link}>
                กลับไปเข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ใช้ styles เดียวกับหน้า Login เพื่อความกลมกลืน
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
    background: "#60a5fa",
    boxShadow: "0 0 10px rgba(59,130,246,0.9)",
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
  roleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 4,
  },
  roleOption: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    transition: "all 0.2s ease",
    backgroundColor: "#ffffff",
  },
  roleOptionSelected: {
    borderColor: "#003366",
    backgroundColor: "#f0f7ff",
  },
  radio: {
    cursor: "pointer",
    width: 18,
    height: 18,
    accentColor: "#003366",
  },
  roleLabel: {
    fontSize: 14,
    color: "#374151",
    userSelect: "none",
  },
};
