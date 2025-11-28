// src/components/SummaryCards.jsx
export default function SummaryCards({ summary }) {
  return (
    <section className="lift-card"
    style={styles.section}>
      <h2 style={styles.sectionTitle}>ภาพรวมระบบ</h2>
      <div style={styles.cardsRow}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>จำนวนลิฟต์ทั้งหมด</p>
          <p style={styles.cardValue}>{summary?.elevators ?? "-"}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>ใบงานซ่อมที่ยังไม่ปิด</p>
          <p style={styles.cardValue}>{summary?.tickets_open ?? "-"}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>แจ้งเตือนที่ยังเปิดอยู่</p>
          <p style={styles.cardValue}>{summary?.alerts_open ?? "-"}</p>
        </div>
      </div>
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
  sectionTitle: { margin: "0 0 8px", fontSize: 16 },
  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  card: {
    background: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    border: "1px solid #e5e7eb",
  },
  cardLabel: { margin: 0, fontSize: 12, color: "#6b7280" },
  cardValue: { margin: 0, marginTop: 4, fontSize: 22, fontWeight: 700 },
};
