import { useAuth } from "./auth";

export const API_BASE = import.meta.env.VITE_API_BASE || "https://liftcare-backend-production.up.railway.app/";

// hook ใช้ใน component
export function useApi() {
  const { token, logout } = useAuth();

  async function request(path, opts = {}) {
    const res = await fetch(API_BASE + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      if (res.status === 401) logout(); // token หมดอายุ → เด้งออก
      const msg = await res.text();
      throw new Error(msg || `HTTP ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  return {
    post: (p, body) => request(p, { method: "POST", body: JSON.stringify(body) }),
    get: (p) => request(p),
    put: (p, body) => request(p, { method: "PUT", body: JSON.stringify(body) }),
    delete: (p) => request(p, { method: "DELETE" }),
  };
}
