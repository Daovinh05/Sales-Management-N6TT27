# Contract: API trạng thái đơn hàng

**Tính năng**: `004-order-status-lifecycle` | **Ngày**: 2026-10-15

Không thêm endpoint mới. Chỉ mở rộng miền `status` của 2 endpoint hiện có. Chi tiết xem [data-model](./data-model.md).

## 1. Admin đổi trạng thái — `PATCH /api/orders/{code}/status`

- **Quyền**: `ADMIN` (`@PreAuthorize` giữ nguyên).
- **Request** (`OrderStatusRequest`): `status` chấp nhận thêm `DANG_CHUAN_BI`
  - Regex mới: `CHO_DUYET|DA_XAC_NHAN|DANG_CHUAN_BI|DANG_GIAO|HOAN_THANH|DA_HUY`
- **Ma trận cho phép** (đồng bộ UI admin):
  - `CHO_DUYET → DA_XAC_NHAN | DA_HUY`
  - `DA_XAC_NHAN → DANG_CHUAN_BI | DA_HUY`
  - `DANG_CHUAN_BI → DANG_GIAO | DA_HUY`
  - `DANG_GIAO → HOAN_THANH | DA_HUY`
  - `HOAN_THANH → (không có)`, `DA_HUY → (không có)`
- **Lỗi**:
  - `400 "Trạng thái đơn hàng không hợp lệ"` — mã lạ (tầng validation).
  - `400 "Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này"` — sai bước hoặc trạng thái kết thúc.
  - `400 "Đơn chưa chọn phương thức thanh toán, không thể xác nhận"` — duyệt đơn chưa có `paymentMethod` (giữ nguyên).

## 2. Khách hủy đơn — `POST /api/orders/{code}/cancel`

- **Quyền**: chủ đơn (`checkOwner`, giữ nguyên).
- **Cho phép**: `CHO_DUYET`, `DA_XAC_NHAN` → `DA_HUY` (kèm hoàn kho + ghi chú hoàn tiền nếu đã trừ kho).
- **Từ chối**: `DANG_CHUAN_BI` trở đi → `400 "Đơn đang giao hoặc đã kết thúc, vui lòng liên hệ shop để hủy"`.
- Không đổi contract: UI khách chỉ hiện nút hủy ở 2 trạng thái cho phép.

## 3. Các endpoint đọc (không đổi contract, thêm giá trị hiển thị)

- `GET /api/orders/mine`, `GET /api/orders` (admin), `GET /api/orders/{code}/detail`: trường `status` có thể trả thêm `DANG_CHUAN_BI`; frontend thêm nhãn “Đang chuẩn bị hàng”.
