# Quickstart: Kiểm chứng thanh toán PayOS + VietQR

## Điều kiện tiên quyết

- Backend `:8080`, MySQL healthy, frontend `:5173` (docker compose).
- Đã có tài khoản PayOS + kênh thanh toán liên kết MB – 0389783619 – DAO VAN VINH.
- Test webhook local: `ngrok http 8080`, dán `https://<id>.ngrok-free.app/api/payments/payos-webhook`
  vào Webhook URL trên `my.payos.vn` rồi bấm xác thực.
- Điền 3 key vào `.env` (không điền vào `.env.example`):
  `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, rồi
  `docker compose up -d --build backend`.

## Kịch bản 1: Tạo link (cần đăng nhập)

1. Đăng nhập lấy JWT:
   `curl -X POST localhost:8080/api/auth/login -d '{"username":"kho1","password":"..."}'` → copy `token`.
2. Tạo đơn (hoặc dùng đơn `CHO_DUYET` có sẵn), rồi:
   `curl -X POST localhost:8080/api/orders/DH1/vietqr-link -H "Authorization: Bearer <token>"`
3. Kết quả mong đợi: `payosConfigured=true`, có `checkoutUrl` + `accountNumber 0389783619`.

## Kịch bản 2: Webhook sai chữ ký / thiếu data (không cần auth)

```bash
curl -X POST localhost:8080/api/payments/payos-webhook \
  -H 'Content-Type: application/json' \
  -d '{"code":"00","data":{"orderCode":123,"amount":50000},"signature":"sai"}'
```

Kết quả mong đợi: HTTP 200, `{"success":false,"message":"Sai chữ ký"}`, đơn không đổi.

## Kịch bản 3: Thanh toán thật end-to-end

1. Mở tab VietQR trong modal thanh toán → bấm "Mở trang thanh toán PayOS".
2. Quét QR bằng app ngân hàng, chuyển đúng số tiền + nội dung.
3. Kết quả mong đợi: trong vài giây modal tự báo thành công (`paid=true`);
   log backend có dòng "đã thanh toán qua PayOS"; đơn vẫn `CHO_DUYET` chờ shop duyệt.
4. Gửi lại cùng webhook lần nữa → vẫn `success=true`, `paid` không đổi, kho không trừ thêm.

## Kịch bản 4: Chưa cấu hình key (fallback demo)

1. Bỏ trống 3 biến `PAYOS_*`, restart backend.
2. Mở tab VietQR → hiện QR demo + nút "Tôi đã chuyển khoản", app không crash.

## Kết quả mong đợi

- Tiền thật về tài khoản MB của shop; hệ thống chỉ chốt khi webhook hợp lệ.
- `mvn test` xanh (gồm `PayosApiClientTest`, `PaymentServiceTest`).
