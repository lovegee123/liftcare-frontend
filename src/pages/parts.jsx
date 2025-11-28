// src/pages/parts.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyPartForm = {
  part_code: "",
  name: "",
  brand: "",
  model: "",
  unit: "",
  cost_price: "",
  sell_price: "",
  min_stock: "",
};

const emptyAdjustForm = {
  part_id: "",
  change_qty: "",
  note: "",
};

// ถ้าสต๊อกน้อยกว่าค่านี้จะถือว่า "ใกล้หมด" (ใช้เป็น default ถ้าไม่ได้ตั้ง min_stock)
const LOW_STOCK_THRESHOLD = 5;

export default function PartsInventory() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [parts, setParts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [partForm, setPartForm] = useState(emptyPartForm);
  const [editingPartId, setEditingPartId] = useState(null);

  const [adjustForm, setAdjustForm] = useState(emptyAdjustForm);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [ps, ss, ms] = await Promise.all([
        api.get("/api/parts"),
        api.get("/api/parts/stocks"),
        api.get("/api/parts/movements"),
      ]);
      setParts(ps);
      setStocks(ss);
      setMovements(ms);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load parts inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------
  // Part form handlers
  // -----------------------------
  function handlePartChange(e) {
    const { name, value } = e.target;
    setPartForm((f) => ({ ...f, [name]: value }));
  }

  async function handlePartSubmit(e) {
    e.preventDefault();

    if (!partForm.part_code || !partForm.name) {
      alert("กรุณากรอก Part Code และ Name");
      return;
    }

    const payload = {
      part_code: partForm.part_code,
      name: partForm.name,
      brand: partForm.brand || null,
      model: partForm.model || null,
      unit: partForm.unit || null,
      cost_price: partForm.cost_price
        ? Number(partForm.cost_price)
        : 0,
      sell_price: partForm.sell_price
        ? Number(partForm.sell_price)
        : 0,
      min_stock: partForm.min_stock
        ? Number(partForm.min_stock)
        : null,
    };

    try {
      if (editingPartId) {
        await api.put(`/api/parts/${editingPartId}`, payload);
      } else {
        await api.post("/api/parts", payload);
      }
      setPartForm(emptyPartForm);
      setEditingPartId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving part");
    }
  }

  function handlePartEdit(part) {
    setEditingPartId(part.id);
    setPartForm({
      part_code: part.part_code || "",
      name: part.name || "",
      brand: part.brand || "",
      model: part.model || "",
      unit: part.unit || "",
      cost_price:
        part.cost_price != null ? String(part.cost_price) : "",
      sell_price:
        part.sell_price != null ? String(part.sell_price) : "",
      min_stock:
        part.min_stock != null ? String(part.min_stock) : "",
    });
  }

  async function handlePartDelete(id) {
    if (!window.confirm("ต้องการลบอะไหล่นี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/parts/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting part");
    }
  }

  function handlePartCancel() {
    setEditingPartId(null);
    setPartForm(emptyPartForm);
  }

  // -----------------------------
  // Adjust stock handlers
  // -----------------------------
  function handleAdjustChange(e) {
    const { name, value } = e.target;
    setAdjustForm((f) => ({ ...f, [name]: value }));
  }

  async function handleAdjustSubmit(e) {
    e.preventDefault();
    if (!adjustForm.part_id) {
      alert("กรุณาเลือกอะไหล่ที่จะปรับสต๊อก");
      return;
    }
    if (adjustForm.change_qty === "") {
      alert("กรุณากรอกจำนวนที่ต้องการปรับ (+/-)");
      return;
    }

    const payload = {
      part_id: Number(adjustForm.part_id),
      change_qty: Number(adjustForm.change_qty),
      note: adjustForm.note || null,
    };

    try {
      await api.post("/api/parts/stocks/adjust", payload);
      setAdjustForm(emptyAdjustForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error adjusting stock");
    }
  }

  // -----------------------------
  // Helper functions
  // -----------------------------
  function getStockForPart(partId) {
    const s = stocks.find((st) => st.part_id === partId);
    return s ? s.quantity : 0;
  }

  function isLowStock(part) {
    const qty = getStockForPart(part.id);
    const min = part.min_stock != null ? part.min_stock : LOW_STOCK_THRESHOLD;
    return qty <= min;
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Spare Parts Inventory</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลอะไหล่ สต๊อกคงเหลือ และประวัติการเคลื่อนไหว
          </p>
        </div>

        {loading && <div className="card">Loading...</div>}
        {error && <div className="card error">{error}</div>}

        {/* ส่วนจัดการอะไหล่ (ฟอร์ม) - เฉพาะ admin */}
        {userRole === "admin" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {editingPartId ? "Edit Part" : "New Part"}
              </div>
            </div>

            <form onSubmit={handlePartSubmit}>
            <div className="form-row">
              <div>
                <label>
                  Part Code *
                  <input
                    name="part_code"
                    value={partForm.part_code}
                    onChange={handlePartChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Name *
                  <input
                    name="name"
                    value={partForm.name}
                    onChange={handlePartChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>
                  Brand
                  <input
                    name="brand"
                    value={partForm.brand}
                    onChange={handlePartChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Model
                  <input
                    name="model"
                    value={partForm.model}
                    onChange={handlePartChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>
                  Unit
                  <input
                    name="unit"
                    value={partForm.unit}
                    onChange={handlePartChange}
                    className="input"
                    placeholder="เช่น pcs, set"
                  />
                </label>
              </div>
              <div>
                <label>
                  Cost Price
                  <input
                    type="number"
                    name="cost_price"
                    value={partForm.cost_price}
                    onChange={handlePartChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Sell Price
                  <input
                    type="number"
                    name="sell_price"
                    value={partForm.sell_price}
                    onChange={handlePartChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            <label>
              Min Stock
              <input
                type="number"
                name="min_stock"
                value={partForm.min_stock}
                onChange={handlePartChange}
                className="input"
              />
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" className="button primary">
                {editingPartId ? "Save Changes" : "Create"}
              </button>
              {editingPartId && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={handlePartCancel}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          </div>
        )}

        {/* ตารางรายการอะไหล่ */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Parts List</div>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Part Code</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Unit</th>
                <th>Cost</th>
                <th>Sell</th>
                <th>Stock Qty</th>
                <th>Min</th>
                {userRole === "admin" && <th style={{ width: 130 }} />}
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => {
                const qty = getStockForPart(p.id);
                const low = isLowStock(p);
                return (
                  <tr key={p.id}>
                    <td>{p.part_code}</td>
                    <td>{p.name}</td>
                    <td>{p.brand}</td>
                    <td>{p.model}</td>
                    <td>{p.unit}</td>
                    <td>{p.cost_price}</td>
                    <td>{p.sell_price}</td>
                    <td>
                      {qty}
                      {low && " (Low)"}
                    </td>
                    <td>{p.min_stock ?? "-"}</td>
                    {userRole === "admin" && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="button sm secondary"
                          onClick={() => handlePartEdit(p)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="button sm danger"
                          onClick={() => handlePartDelete(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {parts.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center">
                    No parts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ฟอร์มปรับสต๊อก */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Adjust Stock</div>
          </div>

          <form onSubmit={handleAdjustSubmit}>
            <label>
              Part *
              <select
                name="part_id"
                value={adjustForm.part_id}
                onChange={handleAdjustChange}
                className="input"
              >
                <option value="">-- select part --</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.part_code} - {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <div>
                <label>
                  Change Qty (+/-) *
                  <input
                    type="number"
                    name="change_qty"
                    value={adjustForm.change_qty}
                    onChange={handleAdjustChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>
                  Note
                  <input
                    name="note"
                    value={adjustForm.note}
                    onChange={handleAdjustChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="button primary">
              Apply Adjustment
            </button>
          </form>
        </div>

        {/* ประวัติการเคลื่อนไหวสต๊อก */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Stock Movements</div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Change</th>
                <th>Note</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.part_code} - {m.part_name}
                  </td>
                  <td>{m.change_qty}</td>
                  <td>{m.note}</td>
                  <td>
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">
                    No movements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedPage>
  );
}