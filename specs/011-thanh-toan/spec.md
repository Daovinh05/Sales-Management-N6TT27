# Đặc tả tính năng (hồi tố): Thanh toán COD / VietQR

**Nhánh tính năng**: `011-thanh-toan`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft (hồi tố)

**Đầu vào**: Tách từ `005-khach-dat-thanh-toan` (US2). Trả tiền cho đơn `CHO_DUYET` (từ `010-dat-hang`) trong `PaymentModal`, cả hai phương thức đều giữ `CHO_DUYET` chờ duyệt.

> Code đã có trên `main`; sequence `mermaid/04-sequence-order.mmd` vẽ **trước khi code** làm checklist (nhờ đó bắt case đóng modal giữa chừng).

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Trả COD / VietQR giữ đơn chờ duyệt (Ưu tiên: P1)

Khách chọn tab COD/VietQR → `POST /api/orders/{code}/payment {paymentMethod}` (`PaymentConfirmRequest`: COD|VIETQR). Chỉ đơn `CHO_DUYET` của chính chủ; xong vẫn `CHO_DUYET`, trừ kho thật ở `HOAN_THANH`.

**Kiểm thử độc lập**: Trả 2 phương thức → 200, `paymentMethod` đã ghi, `status` giữ nguyên.

**Kịch bản chấp nhận**:

1. **Cho** đơn `CHO_DUYET` chính chủ, **Khi** trả COD, **Thì** 200, giữ `CHO_DUYET`.
2. **Cho** đơn đã qua `CHO_DUYET`, **Khi** trả, **Thì** 400 "Đơn hàng không còn ở trạng thái chờ thanh toán".
3. **Cho** method lạ, **Khi** trả, **Thì** 400 "Phương thức thanh toán không hợp lệ".

---

### Chuyện 2 - VietQR qua PayOS + fallback demo (Ưu tiên: P1)

`POST /{code}/vietqr-link` (chỉ `CHO_DUYET` + chưa `paid` + đúng chủ, 1 lần/đơn): đã cấu hình → `{checkoutUrl,qrCode,...payosConfigured:true}`; chưa → `payosConfigured:false`, FE hiện QR demo + nút "Tôi đã chuyển khoản". FE polling 3s `GET /{code}/detail` chờ `paid` → auto `onPaid`. Webhook `POST /api/payments/payos-webhook` (public, luôn 200): verify HMAC, `code=="00"`, khóa ghi chống race, mã lạ bỏ qua 200, idempotent nếu `paid`, lệch tiền từ chối.

**Kiểm thử độc lập**: Webhook gọi 2 lần → 1 ghi nhận; sai ký tự/lệch tiền → từ chối.

**Kịch bản chấp nhận**:

1. **Cho** chưa cấu hình PayOS, **Khi** lấy link, **Thì** `payosConfigured:false`, demo vẫn trả được.
2. **Cho** webhook sai HMAC/lệch tiền, **Khi** gọi, **Thì** không đánh dấu `paid`.
3. **Cho** đóng modal chưa trả, **Khi** rời đi, **Thì** modal xác nhận + banner "Đơn #code đang chờ thanh toán, hàng đã được giữ chỗ".

## Yêu cầu *(bắt buộc)*

- **FR-001**: `confirmPayment` chỉ `CHO_DUYET` + đúng chủ; giữ `CHO_DUYET` sau trả.
- **FR-002**: Link 1 lần/đơn; webhook HMAC + idempotent + khớp tiền; luôn 200 mã lạ.
- **FR-003**: Chữ UI/message tiếng Việt.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: `mvn -Dtest='PaymentServiceTest,PaymentWebhookConcurrencyTest' test` xanh.
- **SC-002**: Đóng modal giữa chừng luôn có banner nhắc (không mất đơn).

## Giả định

- PayOS demo; trừ kho ở Hoàn thành (xem 004/011), không trừ khi trả.
