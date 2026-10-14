# Mô hình dữ liệu: Thanh toán PayOS + VietQR

## Thực thể chính

### Order (bảng `orders`, bổ sung 4 cột)

- `code`: String PK (vd `DH1`), không đổi
- `status`: `CHO_DUYET → DA_XAC_NHAN → DANG_GIAO → HOAN_THANH` (kèm `DA_HUY`), không đổi
- `paymentMethod`: `COD`/`VIETQR`, không đổi
- `paymentAmount`: BigDecimal, nguồn duy nhất của số tiền (không tin client) — mới dùng để đối chiếu webhook
- `payosOrderCode`: Long, unique, nullable — mã số gửi PayOS (`System.currentTimeMillis()` mỗi lần tạo link; link cũ thành mã lạ, webhook tới thì bỏ qua)
- `paymentLinkId`: String(100), nullable — mã link PayOS trả về để tra soát
- `paid`: boolean, mặc định false (`bit default 0` để tương thích dòng cũ) — cờ trực giao với `status`
- `paidAt`: LocalDateTime, nullable — thời điểm webhook xác nhận

### Dữ liệu PayOS (không lưu DB, chỉ qua mạng)

- **Tạo link** (`POST /v2/payment-requests`, header `x-client-id`/`x-api-key`): `{orderCode: số, amount: số nguyên VND, description: ≤25 ký tự chữ/số, cancelUrl, returnUrl, signature}` → nhận `{paymentLinkId, checkoutUrl, qrCode, orderCode, amount, accountNumber, accountName, description}` khi `code == "00"`.
- **Webhook** (`POST` từ PayOS): `{code, desc, success, data: {orderCode, amount, ...}, signature}` — verify bằng cùng hàm ký HMAC.

## Quan hệ

- `Order` 1 – 1 link PayOS hiệu lực tại một thời điểm (qua `payosOrderCode`; các mã cũ bị bỏ rơi nhưng vô hại vì webhook mã lạ luôn bị bỏ qua).
- Webhook không tạo thực thể mới, chỉ cập nhật cờ `paid` của `Order` (idempotent).

## Quy tắc kiểm tra

- Chỉ tạo link khi đơn `CHO_DUYET`, chưa `paid`, đúng chủ đơn, `paymentAmount > 0`, đã cấu hình đủ 3 key.
- Webhook chỉ xử lý khi: đủ `data`, chữ ký đúng, `code == "00"`, tìm được đơn theo `payosOrderCode`, `amount` khớp `paymentAmount`, đơn chưa `paid`.
- Mọi trường hợp còn lại: HTTP 200 + `success=false`, không đổi dữ liệu (kể cả mã lạ từ lần PayOS bấm "xác thực webhook").

## Chuyển trạng thái

```text
paid: false -> true (chỉ qua webhook hợp lệ, một chiều, không quay lại)
status: giữ nguyên máy cũ; paid=true không tự đổi status
link: mỗi lần tạo link mới -> payosOrderCode mới (mã cũ hết hiệu lực sử dụng)
```

## Gợi ý lưu trữ

- Link PayOS mặc định hết hạn 15 phút; DB không lưu hạn link — hết hạn thì khách lấy link mới, đơn vẫn `CHO_DUYET`.
- Follow-up (ngoài plan này): job tự hủy đơn treo quá hạn để nhả hàng `reserved`; nút "Tạo mã mới" trên modal.
