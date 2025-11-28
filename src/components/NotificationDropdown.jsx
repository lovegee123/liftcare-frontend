// src/components/NotificationDropdown.jsx
import { useEffect, useRef } from "react";

export default function NotificationDropdown({
  notifications = [],
  onMarkRead = () => {},
  onDelete = () => {},
  onClose = () => {},
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={dropdownRef} style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>การแจ้งเตือน</span>
      </div>

      <div style={styles.divider} />

      {/* รายการแจ้งเตือน */}
      <div style={styles.list}>
        {notifications.length === 0 && (
          <div style={styles.empty}>ไม่มีการแจ้งเตือน</div>
        )}

        {notifications.map((n) => (
          <div key={n.id} style={styles.itemRow}>
            {/* ด้านซ้าย: ข้อความ + เวลา */}
            <div style={styles.itemLeft}>
              <span style={styles.message}>{n.body || n.title}</span>
              {n.sent_at && (
                <div style={styles.time}>
                  {new Date(n.sent_at).toLocaleString("th-TH")}
                </div>
              )}
            </div>

            {/* ด้านขวา ปุ่มลบ */}
            <button
              style={styles.deleteBtn}
              onClick={() => onDelete(n.id)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fee2e2")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#ef4444")
              }
            >
              ลบ
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      {notifications.some((n) => !n.is_read) && (
        <div style={styles.footer}>
          <button
            style={styles.footerBtn}
            onClick={() => {
              notifications.forEach((n) => {
                if (!n.is_read) onMarkRead(n.id);
              });
            }}
          >
            ทำเป็นอ่านแล้วทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 380,
    minHeight: 250,
    maxHeight: 480,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
    padding: "16px 18px 20px",
    zIndex: 999,
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#111827",
  },

  divider: {
    height: 1,
    background: "#e5e7eb",
    marginBottom: 12,
  },

  list: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  empty: {
    fontSize: 13,
    color: "#9ca3af",
    padding: "8px 4px",
  },

  // แถวหนึ่งของ noti
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "12px 10px",
    borderRadius: 10,
    background: "#f9fafb",
  },

  // ด้านซ้าย
  itemLeft: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },

  message: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.4,
    marginBottom: 3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  time: {
    fontSize: 11,
    color: "#9ca3af",
  },

  // ปุ่มลบ — จัดให้เรียบร้อย
  deleteBtn: {
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 20,
    border: "1px solid #ef4444",
    background: "#ef4444",
    color: "#ffffff",
    cursor: "pointer",
    flexShrink: 0,
    transition: "0.2s ease",
  },

  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
  },

  footerBtn: {
    fontSize: 14,
    padding: "8px 14px",
    borderRadius: 8,
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
    cursor: "pointer",
  },
};
