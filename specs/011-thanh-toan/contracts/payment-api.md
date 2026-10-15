# Contract: API thanh toán

**Tính năng**: `011-thanh-toan`

- `POST /api/orders/{code}/payment {paymentMethod: COD|VIETQR}` → 200, giữ `CHO_DUYET`; sai trạng thái → 400 "Đơn hàng không còn ở trạng thái chờ thanh toán"; method lạ → 400.
- `POST /api/orders/{code}/vietqr-link` → 200 `{checkoutUrl,qrCode,...,payosConfigured}`; chỉ `CHO_DUYET` + chưa `paid` + đúng chủ, 1 lần/đơn.
- `POST /api/payments/payos-webhook` (public, luôn 200): HMAC + `code=="00"` + khớp tiền → `paid/paidAt`; mã lạ bỏ qua 200; gọi lại không ghi 2 lần.
