# Research (hồi tố): Thanh toán

**Ngày**: 2026-10-15 | **Tính năng**: `011-thanh-toan` (tách từ 005)

## Quyết định 1: Trả xong vẫn giữ `CHO_DUYET`

- **Quyết định**: COD/VietQR chỉ ghi `paymentMethod` (+`paid` cho VietQR), 1 điểm trừ kho ở Hoàn thành.
- **Lý do**: Team đổi logic giữa chừng (VietQR không trừ ngay) — test đỏ → sửa test theo code mới.
- **Phương án đã cân nhắc**: VietQR trừ ngay — loại vì trùng deduct, cần chống trừ 2 lần.

## Quyết định 2: PayOS + fallback demo, webhook idempotent

- **Quyết định**: Chưa cấu hình → `payosConfigured:false`, QR demo; webhook verify HMAC + khớp tiền + khóa ghi.
- **Lý do**: Không key thật vẫn demo được; tiền về mới `paid`.
- **Phương án đã cân nhắc**: Bắt buộc PayOS — loại vì đồ án.

## Quyết định 3: Vẽ sequence trước khi code (graphify/mermaid)

- **Quyết định**: `04-sequence-order.mmd` làm checklist → phát hiện case đóng modal giữa chừng → banner + confirm rời.
- **Lý do**: Quy tắc "diagram và code không lệch".
- **Phương án đã cân nhắc**: Code trực tiếp — loại vì từng sót nhánh.

## Hiện trạng code

`PaymentServiceImpl.java:30-122`, `OrderServiceImpl.java:202-221`, `PaymentConfirmRequest.java`, `PaymentModal.jsx:31-398`. Test: `PaymentServiceTest`, `PaymentWebhookConcurrencyTest`.
