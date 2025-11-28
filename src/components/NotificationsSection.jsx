import NotificationBell from "./NotificationBell.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";
import { useState } from "react";

export default function LayoutTopbar({ user, onRefresh, onLogout, notifications, onMarkRead }) {
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const [open, setOpen] = useState(false);

  return (
    <header style={styles.bar}>
      <h1 style={styles.title}>LiftCare</h1>

      <div style={styles.right}>
        <button style={styles.refresh} onClick={onRefresh}>รีเฟรช</button>

        {/* 🔔 ไอคอนระฆัง */}
        <div style={{ position: "relative" }}>
          <NotificationBell
            unreadCount={unreadCount}
            onClick={() => setOpen(!open)}
          />
          {open && (
            <NotificationDropdown
              notifications={notifications}
              onMarkRead={onMarkRead}
              onClose={() => setOpen(false)}
            />
          )}
        </div>

        <span>{user.name}</span>
        <button style={styles.logout} onClick={onLogout}>ออกจากระบบ</button>
      </div>
    </header>
  );
}
