# Mô hình dữ liệu (hồi tố): Thống kê

**Tính năng**: `014-thong-ke` | **Ngày**: 2026-10-15

Đọc từ `orders` + `order_detail` + `inventory` (không thêm bảng).

- `StatsOverview {revenue,completedOrders,totalOrders,cancelledOrders}` — tiền chỉ `HOAN_THANH`.
- `RevenuePoint {date,revenue,orders}` — fill ngày trống 0.
- `StatusCount {status,count}`; `TopProduct {variantCode,productName,quantity,revenue}` — `GROUP BY variant ORDER BY sum(qty) DESC`, cắt limit.
- Tồn thấp: `available = quantity − reserved ≤ 5` (lọc client).
