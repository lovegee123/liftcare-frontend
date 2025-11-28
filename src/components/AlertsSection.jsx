// src/components/AlertsSection.jsx
export default function AlertsSection({ alerts }) {
  return (
    <section className="lift-card"
    style={styles.section}>
      <h2 style={styles.sectionTitle}>แจ้งเตือนลิฟต์</h2>
      {alerts.length === 0 ? (
        <p style={styles.muted}>ยังไม่มีแจ้งเตือน</p>
      ) : (
        <ul style={styles.list}>
          {alerts.slice(0, 10).map((a) => (
            <li key={a.id} style={styles.item}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {a.code} — {a.severity}
                </p>
                <p style={styles.mutedSmall}>{a.message}</p>
              </div>
              <span style={styles.mutedSmall}>
                {new Date(a.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
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
  sectionTitle: { margin: "0 0 8px", fontSize: 16 },
  muted: { color: "#6b7280", fontSize: 13, margin: 0 },
  mutedSmall: { color: "#6b7280", fontSize: 11, margin: 0 },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 8,
  },
  item: {
    padding: 8,
    borderRadius: 10,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
  },
};
