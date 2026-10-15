# Đặc tả tính năng (hồi tố): Lịch sử đơn — thanh toán bù, hủy đơn

**Nhánh tính năng**: `012-lich-su-don`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft (hồi tố)

**Đầu vào**: Tách từ `005-khach-dat-thanh-toan` (US3). Khách theo dõi đơn ở `OrderHistory.jsx`, trả bù đơn chưa trả, hủy khi còn được phép.

> Code đã có trên `main`.

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Xem lịch sử + thanh toán bù (Ưu tiên: P1)

`GET /api/orders/mine` (+ `GET /variants` để hiện tên SP): tab `ALL|CHO_DUYET|...|DA_HUY` + counts, badge "Đã thanh toán" (`paid || (COD && HOAN_THANH)`), modal chi tiết (tiền/trạng thái tiền/giao hàng/bảng SP). Đơn `CHO_DUYET` chưa trả (không COD) hiện nút "Thanh toán" mở lại `PaymentModal` (009); trả xong → `OrderSuccess` (banner mã đơn + nhãn tiền).

**Kịch bản chấp nhận**:

1. **Cho** đơn `CHO_DUYET` chưa trả, **Khi** mở lịch sử, **Thì** có nút thanh toán bù, trả xong hiện `OrderSuccess`.
2. **Cho** F5 ở trang success, **Khi** tải lại, **Thì** reload `GET /{code}/detail` vẫn hiện đúng.

---

### Chuyện 2 - Khách hủy đơn khi còn được phép (Ưu tiên: P1)

Nút "Hủy đơn" chỉ ở `CHO_DUYET`/`DA_XAC_NHAN` → `POST /{code}/cancel` (`cancelByOwner`): chưa trừ kho → nhả `reserved`; đã trừ → cộng trả `quantity` + hạ cờ + note "Khách hủy sau thanh toán - cần hoàn tiền". Từ `DANG_CHUAN_BI` → 400 "Đơn đang giao hoặc đã kết thúc, vui lòng liên hệ shop...".

**Kịch bản chấp nhận**:

1. **Cho** đơn chính chủ `CHO_DUYET`/`DA_XAC_NHAN`, **Khi** hủy, **Thì** 200 `DA_HUY` + kho hoàn đúng.
2. **Cho** đơn từ `DANG_CHUAN_BI` trở đi, **Khi** hủy, **Thì** 400, UI không hiện nút.

## Yêu cầu *(bắt buộc)*

- **FR-001**: `cancelByOwner` chỉ 2 trạng thái đầu; hoàn kho theo `stockDeducted`.
- **FR-002**: Nút hủy/trả bù hiển thị đúng điều kiện; chữ tiếng Việt.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: Hủy đúng 100% ở 2 trạng thái đầu, chặn 100% từ `DANG_CHUAN_BI`.
- **SC-002**: Case trong `OrderServiceTests` (hủy sau trừ kho, khách hủy `DANG_CHUAN_BI` bị chặn) xanh.

## Giả định

- Admin hủy theo 011; ma trận trạng thái theo 004.
