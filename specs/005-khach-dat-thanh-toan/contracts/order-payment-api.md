# Contract: API đặt hàng + thanh toán + lịch sử (khách)

**Tính năng**: `005-khach-dat-thanh-toan`

- `POST /api/orders {customerName,customerPhone,email,shippingAddress,note,discountAmount,items[{variantCode,productName,quantity,unitPrice}]}` → 201 đơn `CHO_DUYET` (giữ chỗ); vượt tồn → 400 "Sản phẩm {name} chỉ còn {n} sản phẩm có thể bán".
- `POST /api/orders/{code}/payment {paymentMethod: COD|VIETQR}` → 200, giữ `CHO_DUYET`; sai trạng thái → 400 "Đơn hàng không còn ở trạng thái chờ thanh toán"; method lạ → 400.
- `POST /api/orders/{code}/vietqr-link` → 200 `{checkoutUrl,qrCode,...,payosConfigured}` (fallback demo khi `false`); chỉ `CHO_DUYET` + chưa `paid` + đúng chủ.
- `POST /api/payments/payos-webhook` (public) → luôn 200; verify HMAC, `code=="00"`, khớp `amount == paymentAmount` → `paid/pa idAt`.
- `GET /api/orders/mine` → đơn của chính chủ; `GET /api/orders/{code}/detail` → chi tiết (403 nếu sai chủ).
- `POST /api/orders/{code}/cancel` → 200 `DA_HUY` + hoàn kho; sau `DA_XAC_NHAN` → 400 "vui lòng liên hệ shop".
