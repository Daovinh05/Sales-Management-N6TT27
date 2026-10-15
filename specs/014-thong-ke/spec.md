# Đặc tả tính năng (hồi tố): Admin thống kê doanh thu

**Nhánh tính năng**: `014-thong-ke`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft (hồi tố)

**Đầu vào**: Tách từ `006-admin-don-thong-ke` (US2). `ThongKe.jsx` + 4 API `/api/admin/stats/*` (class-level ADMIN).

> Code đã có trên `main`.

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Xem KPI + biểu đồ doanh thu (Ưu tiên: P1)

Mặc định 30 ngày: `GET /overview` → `{revenue,completedOrders,totalOrders,cancelledOrders}` (tiền chỉ `HOAN_THANH`); `GET /revenue-by-day` → bar-chart (ngày trống fill 0); `GET /orders-by-status` → donut + thẻ đếm (gồm thẻ "Chuẩn bị hàng" từ 004).

**Kịch bản chấp nhận**:

1. **Cho** khoảng ngày có đơn hủy, **Khi** xem overview, **Thì** `revenue` chỉ cộng `HOAN_THANH`.
2. **Cho** ngày không có đơn, **Khi** xem biểu đồ, **Thì** điểm đó = 0 (không đứt đoạn).

---

### Chuyện 2 - Top bán chạy + tồn thấp + export (Ưu tiên: P2)

`GET /top-products?limit=5` (`GROUP BY variant ORDER BY sum(qty) DESC`, cắt limit) → top-5. Tồn thấp lọc client từ `GET /admin/warehouses/inventory` (`available = quantity − reserved ≤ 5`). Bảng chi tiết (`isPaid = VIETQR || HOAN_THANH`) + phân trang + export Excel.

**Kịch bản chấp nhận**:

1. **Cho** `limit=5`, **Khi** gọi top-products, **Thì** tối đa 5 dòng, xếp theo số lượng.
2. **Cho** tồn `available ≤ 5`, **Khi** mở ThongKe, **Thì** hiện mục tồn thấp.

## Yêu cầu *(bắt buộc)*

- **FR-001**: Doanh thu/top chỉ tính `HOAN_THANH`; revenue-by-day fill ngày trống.
- **FR-002**: Đổi khoảng ngày cập nhật toàn trang; chữ tiếng Việt.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: `StatsServiceTests` 3/3 xanh (doanh thu, top đúng limit, đếm trạng thái).
- **SC-002**: Seed `DH01–DH08` hiển thị đúng số.

## Giả định

- `GET /api/orders` chưa lọc `from/to` nên ThongKe lọc ngày detail phía client (issue cải tiến).
