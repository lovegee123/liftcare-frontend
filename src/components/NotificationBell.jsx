// src/components/NotificationBell.jsx
import { useState } from "react";

export default function NotificationBell({ unreadCount, onClick }) {
  return (
    <div style={styles.wrap} onClick={onClick}>
      {/* Bell Icon (SVG) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="#ffffff" // ← เปลี่ยนเป็นสีขาว
        style={styles.bell}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.657c-.41 0-.79.166-1.061.437a1.5 1.5 0 01-2.122 0 1.498 1.498 0 00-1.06-.437H6.75A2.25 2.25 0 014.5 15.407V11.25a7.5 7.5 0 0115 0v4.157a2.25 2.25 0 01-2.25 2.25h-3.393z"
        />
      </svg>

      {/* Badge */}
      {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
    </div>
  );
}

const styles = {
  wrap: {
    position: "relative",
    cursor: "pointer",
    padding: 8, // ลด padding
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bell: {
    width: 24,
    height: 24,
    color: "#ffffff", // ← เปลี่ยนเป็นสีขาว
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    fontSize: 10,
    padding: "2px 5px",
    minWidth: 16,
    textAlign: "center",
  },
};
