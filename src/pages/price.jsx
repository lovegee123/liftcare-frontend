// src/pages/pricing.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptySettings = {
  id: null,
  call_fee: 0,
  labor_rate_per_hour: 0,
  parts_markup_percent: 0,
  currency: "THB",
};

export default function PricingSettings() {
  const api = useApi();
  const userRole = useRoleCheck();
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/pricing-settings");
      setSettings({
        id: data.id ?? null,
        call_fee: data.call_fee ?? 0,
        labor_rate_per_hour: data.labor_rate_per_hour ?? 0,
        parts_markup_percent: data.parts_markup_percent ?? 0,
        currency: data.currency || "THB",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load pricing settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setSettings((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: settings.id,
        call_fee: Number(settings.call_fee || 0),
        labor_rate_per_hour: Number(settings.labor_rate_per_hour || 0),
        parts_markup_percent: Number(settings.parts_markup_percent || 0),
        currency: settings.currency || "THB",
      };
      const updated = await api.put("/api/pricing-settings", payload);
      setSettings({
        id: updated.id,
        call_fee: updated.call_fee ?? 0,
        labor_rate_per_hour: updated.labor_rate_per_hour ?? 0,
        parts_markup_percent: updated.parts_markup_percent ?? 0,
        currency: updated.currency || "THB",
      });
      alert("บันทึกค่าตั้งราคาสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving pricing settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles="admin">
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Pricing Settings</h2>
          <p className="app-page-subtitle">
            ตั้งค่าค่าเรียกช่าง อัตราค่าแรงต่อชั่วโมง และส่วนเพิ่มราคาอะไหล่ของระบบ
          </p>
        </div>

        {loading ? (
          <div className="card">Loading...</div>
        ) : (
          <div className="card">
            <div className="card-title">Global Pricing Configuration</div>
            {error && <div className="card error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* แถว Call fee + Labor rate */}
              <div className="form-row">
                <div>
                  <label>
                    Call Fee (ค่าเรียกช่าง)
                    <input
                      type="number"
                      name="call_fee"
                      value={settings.call_fee}
                      onChange={handleChange}
                      className="input"
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Labor Rate per Hour (ค่าแรง/ชม.)
                    <input
                      type="number"
                      name="labor_rate_per_hour"
                      value={settings.labor_rate_per_hour}
                      onChange={handleChange}
                      className="input"
                    />
                  </label>
                </div>
              </div>

              {/* แถว Markup + Currency */}
              <div className="form-row">
                <div>
                  <label>
                    Parts Markup (%) (เปอร์เซ็นต์บวกค่าอะไหล่)
                    <input
                      type="number"
                      name="parts_markup_percent"
                      value={settings.parts_markup_percent}
                      onChange={handleChange}
                      className="input"
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Currency
                    <input
                      name="currency"
                      value={settings.currency}
                      onChange={handleChange}
                      className="input"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="button primary"
                disabled={saving}
                style={{ marginTop: 8 }}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}