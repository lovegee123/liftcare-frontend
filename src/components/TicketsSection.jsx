// src/components/TicketsSection.jsx
export default function TicketsSection({ tickets, onOpenCreate }) {
  return (
    <section className="lift-card"
    style={styles.section}>
      <div style={styles.headerRow}>
        <h2 style={styles.sectionTitle}>ใบงานซ่อมล่าสุด</h2>
        <button style={styles.primaryBtn} onClick={onOpenCreate}>
          สร้างใบแจ้งซ่อม
        </button>
      </div>

      {tickets.length === 0 ? (
        <p style={styles.muted}>ยังไม่มีใบงาน</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>รหัสใบงาน</th>
              <th>ลิฟต์</th>
              <th>สถานะ</th>
              <th>ความสำคัญ</th>
              <th>สร้างเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {tickets.slice(0, 10).map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.elevator_name || t.elevator_id}</td>
                <td>{t.status}</td>
                <td>{t.priority}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const styles = {
  section: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { margin: 0, fontSize: 16 },
  muted: { color: "#6b7280", fontSize: 13, margin: 0 },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  primaryBtn: {
    height: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
};
