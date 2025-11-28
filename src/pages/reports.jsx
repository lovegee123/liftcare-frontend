// src/pages/reports.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck } from "../hooks/useRoleCheck";

export default function Reports() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Analytics Data
  const [analytics, setAnalytics] = useState(null);
  const [faultRate, setFaultRate] = useState([]);
  const [maintenanceSummary, setMaintenanceSummary] = useState(null);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  async function loadReports() {
    if (userRole !== "admin") {
      setError("Access denied. Admin only.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [analyticsData, faultRateData, summaryData] = await Promise.all([
        api.get("/api/dashboard/analytics"),
        api.get("/api/reports/elevator-fault-rate"),
        api.get(`/api/reports/maintenance-summary?start_date=${startDate}&end_date=${endDate}`),
      ]);

      setAnalytics(analyticsData);
      setFaultRate(faultRateData || []);
      setMaintenanceSummary(summaryData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  // Helper: สร้างกราฟแบบง่าย ๆ ด้วย CSS
  function SimpleBarChart({ data, labelKey, valueKey, maxValue, color = "#003366" }) {
    if (!data || data.length === 0) {
      return <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No data</div>;
    }

    return (
      <div style={{ padding: "16px" }}>
        {data.map((item, idx) => {
          const value = item[valueKey] || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div key={idx} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: "500" }}>{item[labelKey]}</span>
                <span style={{ fontSize: "13px", color: "#666" }}>{value.toLocaleString()}</span>
              </div>
              <div
                style={{
                  height: "24px",
                  background: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percentage}%`,
                    background: color,
                    transition: "width 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "8px",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                >
                  {percentage > 10 && `${percentage.toFixed(0)}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Helper: สร้าง Pie Chart แบบง่าย
  function SimplePieChart({ data, labelKey, valueKey }) {
    if (!data || data.length === 0) {
      return <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No data</div>;
    }

    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
    const colors = ["#003366", "#004080", "#0059b3", "#0073e6", "#1a8cff", "#4da6ff"];

    let currentAngle = 0;
    const segments = data.map((item, idx) => {
      const value = item[valueKey] || 0;
      const percentage = total > 0 ? (value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      return {
        ...item,
        percentage,
        startAngle,
        angle,
        color: colors[idx % colors.length],
      };
    });

    return (
      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
        <div style={{ width: "200px", height: "200px", position: "relative" }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            {segments.map((seg, idx) => {
              const startAngleRad = (seg.startAngle * Math.PI) / 180;
              const endAngleRad = ((seg.startAngle + seg.angle) * Math.PI) / 180;
              const x1 = 100 + 80 * Math.cos(startAngleRad);
              const y1 = 100 + 80 * Math.sin(startAngleRad);
              const x2 = 100 + 80 * Math.cos(endAngleRad);
              const y2 = 100 + 80 * Math.sin(endAngleRad);
              const largeArc = seg.angle > 180 ? 1 : 0;

              return (
                <path
                  key={idx}
                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={seg.color}
                  stroke="#fff"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          {segments.map((seg, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  background: seg.color,
                  borderRadius: "3px",
                  marginRight: "8px",
                }}
              />
              <span style={{ fontSize: "13px", flex: 1 }}>{seg[labelKey]}</span>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "#666" }}>
                {seg.percentage.toFixed(1)}% ({seg[valueKey]})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (userRole !== "admin") {
    return (
      <div className="page-container">
        <div className="alert-error">Access denied. Admin only.</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📊 Reports & Analytics</h1>
        <p className="page-subtitle">รายงานและสถิติการทำงานของระบบ</p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div>Loading reports...</div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && analytics && (
        <>
          {/* Date Filter */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <label style={{ fontSize: "14px", fontWeight: "500" }}>ช่วงวันที่:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <span>ถึง</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <button className="button primary" onClick={loadReports}>
                อัปเดต
              </button>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              💰 รายได้รายเดือน (6 เดือนล่าสุด)
            </h2>
            {analytics.monthly_revenue && analytics.monthly_revenue.length > 0 ? (
              <SimpleBarChart
                data={analytics.monthly_revenue}
                labelKey="month"
                valueKey="revenue"
                maxValue={Math.max(...analytics.monthly_revenue.map((r) => r.revenue || 0))}
                color="#10b981"
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No revenue data</div>
            )}
          </div>

          {/* Monthly Jobs Chart */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              🔧 งานซ่อมบำรุงรายเดือน
            </h2>
            {analytics.monthly_jobs && analytics.monthly_jobs.length > 0 ? (
              <SimpleBarChart
                data={analytics.monthly_jobs}
                labelKey="month"
                valueKey="job_count"
                maxValue={Math.max(...analytics.monthly_jobs.map((j) => j.job_count || 0))}
                color="#3b82f6"
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No job data</div>
            )}
          </div>

          {/* Elevator Status Pie Chart */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              🏢 สถานะลิฟต์
            </h2>
            {analytics.elevator_status && analytics.elevator_status.length > 0 ? (
              <SimplePieChart
                data={analytics.elevator_status}
                labelKey="state"
                valueKey="count"
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No status data</div>
            )}
          </div>

          {/* Top Issues */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              ⚠️ ลิฟต์ที่เสียบ่อย (Top 10)
            </h2>
            {analytics.top_issues && analytics.top_issues.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>รหัสลิฟต์</th>
                    <th>ชื่อ</th>
                    <th>ยี่ห้อ</th>
                    <th>จำนวนครั้งที่เสีย</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.top_issues.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.id}</td>
                      <td>{issue.name || "-"}</td>
                      <td>{issue.brand || "-"}</td>
                      <td>{issue.fault_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No issues data</div>
            )}
          </div>

          {/* Fault Rate by Brand */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              📈 อัตราการเสียตามยี่ห้อ/รุ่น
            </h2>
            {faultRate.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>ยี่ห้อ</th>
                    <th>รุ่น</th>
                    <th>จำนวนลิฟต์</th>
                    <th>จำนวนครั้งที่เสีย</th>
                    <th>อัตราการเสีย (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {faultRate.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.brand || "-"}</td>
                      <td>{item.model || "-"}</td>
                      <td>{item.total_elevators}</td>
                      <td>{item.fault_count}</td>
                      <td>
                        <span
                          style={{
                            color: item.fault_rate_percent > 20 ? "#dc2626" : "#059669",
                            fontWeight: "500",
                          }}
                        >
                          {item.fault_rate_percent || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>No fault rate data</div>
            )}
          </div>

          {/* Maintenance Summary */}
          {maintenanceSummary && (
            <div className="card" style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
                📋 สรุปงานบำรุงรักษา
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>งานทั้งหมด</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: "#003366" }}>
                    {maintenanceSummary.summary?.total_jobs || 0}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>ค่าใช้จ่ายรวม</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: "#059669" }}>
                    ฿{parseFloat(maintenanceSummary.summary?.total_cost || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>ค่าแรงรวม</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: "#3b82f6" }}>
                    ฿{parseFloat(maintenanceSummary.summary?.total_labor_cost || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>ค่าอะไหล่รวม</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: "#8b5cf6" }}>
                    ฿{parseFloat(maintenanceSummary.summary?.total_parts_cost || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>เวลาเฉลี่ย (ชม.)</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: "#f59e0b" }}>
                    {parseFloat(maintenanceSummary.summary?.avg_duration_hours || 0).toFixed(1)}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>ลิฟต์ที่ให้บริการ</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", color: "#ec4899" }}>
                    {maintenanceSummary.summary?.elevators_serviced || 0}
                  </div>
                </div>
              </div>

              {maintenanceSummary.by_type && maintenanceSummary.by_type.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>แยกตามประเภท</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ประเภท</th>
                        <th>จำนวนงาน</th>
                        <th>ค่าใช้จ่าย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceSummary.by_type.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.job_type}</td>
                          <td>{item.count}</td>
                          <td>฿{parseFloat(item.cost || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Top Parts */}
          {analytics.top_parts && analytics.top_parts.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
                🔩 อะไหล่ที่ใช้บ่อย (Top 10)
              </h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>รหัสอะไหล่</th>
                    <th>ชื่อ</th>
                    <th>จำนวนครั้งที่ใช้</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.top_parts.map((part, idx) => (
                    <tr key={idx}>
                      <td>{part.part_code}</td>
                      <td>{part.name}</td>
                      <td>{part.usage_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

