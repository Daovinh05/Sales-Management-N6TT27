# Contract: API admin đơn hàng + thống kê

**Tính năng**: `006-admin-don-thong-ke`

## Đơn hàng (`@PreAuthorize("hasRole('ADMIN')")`)

- `GET /api/orders?code&customer&status&payment` — `''` = tất cả, `EMPTY` = chưa có phương thức.
- `GET /api/orders/{code}` — chi tiết full (admin).
- `PATCH /api/orders/{code}/status {status}` (`OrderStatusRequest` 6 mã) — theo `NEXT_STATUSES`; lỗi: 400 mã lạ / 400 sai bước / 400 thiếu phương thức.
- `DELETE /api/orders/{code}` — đang xử lý nhả giữ; đã trừ cộng trả.

## Thống kê (`/api/admin/stats`, class-level ADMIN, `from` mặc định −29d)

- `GET /overview?from&to` → `{revenue,completedOrders,totalOrders,cancelledOrders}` (tiền chỉ `HOAN_THANH`).
- `GET /revenue-by-day?from&to` → `[{date,revenue,orders}]` (fill ngày trống 0).
- `GET /orders-by-status?from&to` → `[{status,count}]`.
- `GET /top-products?from&to&limit=5` → `[{variantCode,productName,quantity,revenue}]` xếp theo số lượng.
