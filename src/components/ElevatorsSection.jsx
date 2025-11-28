// src/components/ElevatorsSection.jsx
export default function ElevatorsSection({ elevators }) {
  return (
    <section className="lift-card"
    style={styles.section}>
      <h2 style={styles.sectionTitle}>สถานะลิฟต์</h2>
      {elevators.length === 0 ? (
        <p style={styles.muted}>ยังไม่มีข้อมูลลิฟต์</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อาคาร</th>
              <th>ชั้น</th>
              <th>สถานะ</th>
              <th>อัปเดตล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {elevators.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.building_name || e.building_id}</td>
                <td>{e.current_floor}</td>
                <td>{e.status}</td>
                <td>
                  {new Date(
                    e.last_maintenance_at || e.updated_at || e.created_at
                  ).toLocaleString()}
                </td>
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
  sectionTitle: { margin: "0 0 8px", fontSize: 16 },
  muted: { color: "#6b7280", fontSize: 13, margin: 0 },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
};
