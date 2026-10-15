# Mô hình dữ liệu (hồi tố): Cụm khách — Đặt hàng, thanh toán, lịch sử

**Tính năng**: `005-khach-dat-thanh-toan` | **Ngày**: 2026-10-15

## Thực thể

| Thực thể | Trường chính | Ràng buộc |
|---|---|---|
| `Order` | `code` PK (`DHnn`), `status`, `paymentMethod` (COD/VIETQR/null), `paid/paidAt`, `stockDeducted`, `total`, `discountAmount`, `paymentAmount = total − discount` | Giá từ DB; vượt tồn → 400 + số bán được; `username` chủ đơn (xem 007) |
| `OrderDetail` | `variantCode`, `productName`, `quantity @Positive`, `unitPrice` (server tính lại) | `Order 1—n OrderDetail` |
| `Inventory` | `quantity`, `reservedQuantity` | `bán được = quantity − reserved`; kho trung tâm id=1, khóa bi quan khi giữ/trừ |

## Quy tắc kiểm chứng

- `paymentMethod` ngoài COD/VIETQR → 400 "Phương thức thanh toán không hợp lệ" (`PaymentConfirmRequest` + service).
- `confirmPayment` chỉ khi `CHO_DUYET`, đúng chủ (`checkOwner`; đơn vãng lai cho phép theo mã).
- `cancelByOwner` chỉ `CHO_DUYET`/`DA_XAC_NHAN` → `DA_HUY`; sau đó → 400 "vui lòng liên hệ shop".
- Hủy: chưa trừ kho → nhả `reserved`; đã trừ → cộng trả `quantity` + hạ cờ + note "Khách hủy sau thanh toán - cần hoàn tiền".
- Webhook: sai HMAC/lệch tiền → từ chối (vẫn 200 cho mã lạ để PayOS không retry vô hạn); gọi 2 lần 1 ghi nhận.

## Quan hệ

- `Order 1—n OrderDetail`; `Order → Inventory` gián tiếp qua `variantCode`; `Order.username → User` (auth xem 007; đơn vãng lai `username == null` thao tác theo mã).
