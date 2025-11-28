import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, useCustomerId, ProtectedPage } from "../hooks/useRoleCheck";

export default function CustomerPortal() {
  const api = useApi();
  const userRole = useRoleCheck();
  const customerId = useCustomerId(); // ✅ ดึง customer_id

  const [customerData, setCustomerData] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomerPortal(targetCustomerId = null) {
    try {
      setLoading(true);
      setError("");

      // ดึงรายชื่อลูกค้าทั้งหมด (สำหรับ admin)
      let allCusts = [];
      if (userRole === "admin") {
        try {
          allCusts = await api.get("/api/customers");
          setAllCustomers(allCusts || []);
        } catch (e) {
          console.warn("Could not fetch customers list:", e);
        }
      }

      // กำหนดลูกค้าที่จะดูข้อมูล
      let targetCustId = targetCustomerId;
      if (!targetCustId) {
        if (userRole === "customer") {
          // สำหรับ customer ใช้ customer_id ของตัวเอง
          if (!customerId) {
            setError("Customer ID not found. Please contact admin.");
            setLoading(false);
            return;
          }
          targetCustId = customerId;
        } else if (userRole === "admin" && allCusts.length > 0) {
          // สำหรับ admin ถ้ายังไม่เลือก ให้เลือกลูกค้าแรก
          targetCustId = allCusts[0].id;
          setSelectedCustomerId(allCusts[0].id);
        }
      }

      if (!targetCustId) {
        setError("No customer selected.");
        setLoading(false);
        return;
      }

      // ดึงข้อมูลลูกค้า
      let custData = null;
      if (userRole === "admin") {
        // สำหรับ admin หาข้อมูลลูกค้าจากรายชื่อที่ดึงมา
        const selectedCust = allCusts.find((c) => c.id === targetCustId);
        if (selectedCust) {
          custData = selectedCust;
          setCustomerData(selectedCust);
        }
      } else {
        // สำหรับ customer ใช้ /api/customers/me
        try {
          custData = await api.get("/api/customers/me");
          setCustomerData(custData);
        } catch (e) {
          console.error("Could not fetch customer data:", e);
        }
      }

      // ดึงข้อมูลทั้งหมด
      const [bld, elv, con, quo, inv] = await Promise.all([
        api.get("/api/buildings"),
        api.get("/api/elevators"),
        api.get("/api/contracts"),
        api.get("/api/quotations"),
        api.get("/api/invoices"),
      ]);

      // Filter ข้อมูลตามลูกค้าที่เลือก (ถ้าเป็น admin)
      if (targetCustId && userRole === "admin") {
        // Filter buildings ตาม customer_id
        const filteredBuildings = (bld || []).filter(
          (b) => b.customer_id === targetCustId
        );
        setBuildings(filteredBuildings);

        // Filter elevators ตาม buildings
        const buildingIds = new Set(filteredBuildings.map((b) => b.id));
        const filteredElevators = (elv || []).filter((e) =>
          buildingIds.has(e.building_id)
        );
        setElevators(filteredElevators);

        // Filter contracts, quotations, invoices ตาม customer_id
        setContracts((con || []).filter((c) => c.customer_id === targetCustId));
        setQuotations((quo || []).filter((q) => q.customer_id === targetCustId));
        setInvoices((inv || []).filter((i) => i.customer_id === targetCustId));
      } else {
        // สำหรับ customer ปกติ หรือ admin ที่ยังไม่เลือก
        setBuildings(bld || []);
        setElevators(elv || []);
        setContracts(con || []);
        setQuotations(quo || []);
        setInvoices(inv || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load customer portal");
    } finally {
      setLoading(false);
    }
  }

  function handleCustomerChange(e) {
    const custId = e.target.value ? Number(e.target.value) : null;
    setSelectedCustomerId(custId);
    loadCustomerPortal(custId);
  }

  useEffect(() => {
    loadCustomerPortal();
  }, []);

  // ---- Stats ----
  const stats = {
    buildings: buildings.length,
    elevators: elevators.length,
    activeContracts: contracts.filter((c) => {
      const today = new Date();
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return start <= today && today <= end;
    }).length,
    pendingQuotations: quotations.filter((q) => q.status === "draft").length,
    unpaidInvoices: invoices.filter((i) => i.status === "unpaid" || i.status === "partial").length,
  };

  // ---- Recent invoices ----
  const recentInvoices = invoices
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  // ---- Upcoming contracts expiry ----
  const upcomingExpiry = contracts
    .filter((c) => {
      const end = new Date(c.end_date);
      const today = new Date();
      const days = (end - today) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 90;
    })
    .slice(0, 3);

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "customer"]}>
      <div>
        {/* Header */}
        <div className="app-page-header">
          <h2 className="app-page-title">Customer Portal</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลอาคาร ลิฟต์ และติดตามสัญญา ใบเสนอราคา ใบแจ้งหนี้
          </p>
        </div>

        {/* Selector สำหรับ admin เลือกลูกค้า */}
        {userRole === "admin" && allCustomers.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              เลือกลูกค้าที่ต้องการดูข้อมูล:
            </label>
            <select
              value={selectedCustomerId || ""}
              onChange={handleCustomerChange}
              className="input"
              style={{ width: "100%", maxWidth: 400 }}
            >
              <option value="">-- เลือกลูกค้า --</option>
              {allCustomers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                  {cust.business_type ? ` (${cust.business_type})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && <div className="card">Loading portal...</div>}
        {error && <div className="card error">{error}</div>}

        {!loading && !error && userRole === "admin" && allCustomers.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 24 }}>
            <p>ยังไม่มีลูกค้าในระบบ กรุณาเพิ่มลูกค้าก่อน</p>
          </div>
        )}

        {!loading && !error && customerData && (
          <>
            {/* Section 1: Company Info */}
            <div className="card">
              <div className="card-title">
                {userRole === "admin" ? "Customer Information" : "Your Company Information"}
              </div>
              {customerData && (
                <div>
                  <p>
                    <strong>Name:</strong> {customerData.name}
                  </p>
                  <p>
                    <strong>Business Type:</strong> {customerData.business_type}
                  </p>
                  <p>
                    <strong>Address:</strong> {customerData.address || "-"}
                  </p>
                  <p>
                    <strong>Contact:</strong> {customerData.contact_name || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {customerData.contact_phone || "-"}
                  </p>
                  <p>
                    <strong>Email:</strong> {customerData.contact_email || "-"}
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Statistics */}
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-title">Buildings</div>
                <div className="stat-number">{stats.buildings}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Elevators</div>
                <div className="stat-number">{stats.elevators}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Active Contracts</div>
                <div className="stat-number">{stats.activeContracts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Pending Quotations</div>
                <div className="stat-number">{stats.pendingQuotations}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Unpaid Invoices</div>
                <div className="stat-number">{stats.unpaidInvoices}</div>
              </div>
            </div>

            {/* Section 3: Buildings & Elevators */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Buildings */}
              <div className="card">
                <div className="card-title">Buildings</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.name}</td>
                        <td>{b.building_type || "-"}</td>
                      </tr>
                    ))}
                    {buildings.length === 0 && (
                      <tr>
                        <td colSpan={2} className="text-center">
                          No buildings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Elevators */}
              <div className="card">
                <div className="card-title">Your Elevators</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Building</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elevators.map((e) => (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.building_name || "-"}</td>
                        <td>{e.state}</td>
                      </tr>
                    ))}
                    {elevators.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No elevators.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Contracts */}
            <div className="card">
              <div className="card-title">Active Contracts</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts
                    .filter((c) => {
                      const today = new Date();
                      const start = new Date(c.start_date);
                      const end = new Date(c.end_date);
                      return start <= today && today <= end;
                    })
                    .map((c) => (
                      <tr key={c.id}>
                        <td>{c.contract_code}</td>
                        <td>
                          {c.contract_type === "annual"
                            ? "Annual"
                            : "Per Call"}
                        </td>
                        <td>
                          {new Date(c.start_date).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(c.end_date).toLocaleDateString()}
                        </td>
                        <td>Active</td>
                      </tr>
                    ))}
                  {contracts.filter((c) => {
                    const today = new Date();
                    const start = new Date(c.start_date);
                    const end = new Date(c.end_date);
                    return start <= today && today <= end;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No active contracts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 5: Upcoming Contract Expiry */}
            {upcomingExpiry.length > 0 && (
              <div className="card" style={{ borderLeft: "4px solid #ff9800" }}>
                <div className="card-title">⚠️ Contracts Expiring Soon</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>End Date</th>
                      <th>Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingExpiry.map((c) => {
                      const daysLeft = Math.ceil(
                        (new Date(c.end_date) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr key={c.id}>
                          <td>{c.contract_code}</td>
                          <td>
                            {new Date(c.end_date).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              style={{
                                color: daysLeft <= 30 ? "red" : "orange",
                              }}
                            >
                              {daysLeft} days
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section 6: Quotations & Invoices */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Quotations */}
              <div className="card">
                <div className="card-title">Quotations</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.slice(0, 5).map((q) => (
                      <tr key={q.id}>
                        <td>{q.quotation_code}</td>
                        <td>{q.status}</td>
                        <td>{q.total_amount}</td>
                      </tr>
                    ))}
                    {quotations.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No quotations.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recent Invoices */}
              <div className="card">
                <div className="card-title">Recent Invoices</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((i) => (
                      <tr key={i.id}>
                        <td>{i.invoice_code}</td>
                        <td>{i.status}</td>
                        <td>{i.total_amount}</td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No invoices.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
