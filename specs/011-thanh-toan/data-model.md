# Mô hình dữ liệu (hồi tố): Thanh toán

**Tính năng**: `011-thanh-toan` | **Ngày**: 2026-10-15

| Thực thể | Trường dùng | Ràng buộc |
|---|---|---|
| `Order` | `paymentMethod` (COD/VIETQR/null), `paid/paidAt`, `payosOrderCode`, `paymentLinkId`, `stockDeducted` | Trả chỉ khi `CHO_DUYET`; trừ kho ở Hoàn thành, không động ở đây |
| Webhook PayOS | `code=="00"`, `amount`, chữ ký HMAC | Khớp `amount == paymentAmount` mới `paid`; idempotent |

Quan hệ: `Order → Inventory` giữ nguyên giữ chỗ từ 008 cho tới Hoàn thành (004/011).
