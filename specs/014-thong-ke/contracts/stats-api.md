# Contract: API thống kê (admin)

**Tính năng**: `014-thong-ke` — base `/api/admin/stats`, class-level ADMIN, `from` mặc định −29d.

- `GET /overview?from&to` → `{revenue,completedOrders,totalOrders,cancelledOrders}` (tiền chỉ `HOAN_THANH`).
- `GET /revenue-by-day?from&to` → `[{date,revenue,orders}]` (fill 0).
- `GET /orders-by-status?from&to` → `[{status,count}]`.
- `GET /top-products?from&to&limit=5` → tối đa 5, xếp theo số lượng.
