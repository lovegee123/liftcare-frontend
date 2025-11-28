export function useRoleCheck() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.role || null;
}

// ✅ ดึง customer_id จาก localStorage
export function useCustomerId() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.customer_id || null;
}

export function canAccess(userRole, allowedRoles) {
  if (!userRole) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole);
}

export function ProtectedPage({ userRole, allowedRoles, children }) {
  if (!canAccess(userRole, allowedRoles)) {
    return (
      <div className="card error">
        <h3>Access Denied</h3>
        <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }
  return children;
}
