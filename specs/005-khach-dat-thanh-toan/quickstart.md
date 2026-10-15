# Quickstart (hồi tố): Kiểm chứng đặt hàng, thanh toán, lịch sử

**Tính năng**: `005-khach-dat-thanh-toan` | Contract: [order-payment](./contracts/order-payment-api.md) | Auth: `007-auth-dang-nhap`

## Điều kiện tiên quyết

Docker dev chạy (`sales-mysql` healthy, backend :8080, frontend :5173); đã đăng nhập `customer/123456` (lấy token theo `007-auth-dang-nhap/quickstart.md` Kịch bản 2).

## Kịch bản 1: Đặt hàng + thanh toán (UI sống cho demo bảo vệ)

1. Đăng nhập `customer/123456` → thêm SP vào giỏ → Checkout → đặt → `PaymentModal` mở, đơn `CHO_DUYET`.
2. Trả COD → vẫn `CHO_DUYET` (chờ duyệt); tạo đơn khác trả VietQR demo → vẫn `CHO_DUYET`.
3. Đóng modal chưa trả → kiểm tra toast + banner vàng + modal xác nhận rời đi.
4. Vào Lịch sử mua hàng → nút "Thanh toán" ở đơn chưa trả → trả bù được; nút "Hủy đơn" chỉ ở 2 tab đầu.

## Kịch bản 2: Test tự động

```bash
cd backend
mvn -Dtest='OrderServiceTests,PaymentServiceTest,PaymentWebhookConcurrencyTest' test
# Kỳ vọng: BUILD SUCCESS (vượt tồn không ghi DB; spoof giá bị bỏ qua; webhook 2 lần 1 ghi nhận)
```
