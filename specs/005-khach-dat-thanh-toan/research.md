# Research (hồi tố): Cụm khách

**Ngày**: 2026-10-15 | **Tính năng**: `005-khach-dat-thanh-toan`

## Quyết định 1: Giữ chỗ 2 bước (reserve lúc đặt, trừ thật lúc Hoàn thành)

- **Quyết định**: `POST /api/orders` chỉ tăng `reserved` (khóa bi quan kho trung tâm); `deductStockIfNeeded` chạy ở `HOAN_THANH` (COD) / webhook VietQR; cờ `stockDeducted` chống trừ 2 lần.
- **Lý do**: Hỏi Agent trước khi code ("đặt hàng trừ kho thế nào cho hợp lý") → chốt giữ chỗ để COD chưa thu tiền không mất tồn, VietQR demo chưa về tiền không trừ sớm.
- **Phương án đã cân nhắc**: Trừ ngay khi đặt — loại vì đơn hủy/hết phiên hoàn kho phức tạp và dễ bán lố khi thanh toán treo.

## Quyết định 2: COD/VietQR đều giữ `CHO_DUYET` sau khi trả

- **Quyết định**: `confirmPayment` chỉ ghi `paymentMethod` (+ `paid` cho VietQR demo/webhook), không đổi `status`; shop duyệt sau.
- **Lý do**: Team đổi logic giữa chừng (VietQR không trừ ngay) — test đỏ → đọc code mới → sửa test theo; giữ 1 điểm trừ kho duy nhất ở Hoàn thành.
- **Phương án đã cân nhắc**: VietQR trừ ngay khi trả — loại vì trùng deduct và cần chống trừ 2 lần thêm.

## Quyết định 3: PayOS link + webhook HMAC idempotent, fallback demo

- **Quyết định**: `/{code}/vietqr-link` (chỉ `CHO_DUYET` + chưa `paid` + đúng chủ) → PayOS khi đã cấu hình, else `payosConfigured=false` để FE hiện QR demo + nút "Tôi đã chuyển khoản"; webhook luôn 200, verify HMAC, `code=="00"`, khóa ghi, check khớp tiền, idempotent.
- **Lý do**: Chạy được cả 2 môi trường (có/không PayOS) mà không vỡ luồng; tiền về mới `paid`.
- **Phương án đã cân nhắc**: Bắt buộc PayOS — loại vì đồ án không có key thật vẫn phải demo được.

## Quyết định 4: Vẽ sequence trước khi code payment (skill graphify/mermaid)

- **Quyết định**: Sinh `mermaid/04-sequence-order.mmd` (đặt → giữ chỗ → modal → COD/VietQR → trừ/nhả kho) làm checklist; thiếu nhánh nào biết ngay.
- **Lý do**: Nhờ diagram mới phát hiện case đóng modal giữa chừng → thêm banner nhắc + modal xác nhận rời đi; quy tắc "diagram và code không lệch".
- **Phương án đã cân nhắc**: Code trực tiếp không vẽ — loại vì đã từng sót nhánh.

## Quyết định 5: Skill explore + soạn commit + diff/log (kiểm soát code)

- **Quyết định**: Mọi task bắt đầu bằng `explore` (đọc nhiều file rồi tóm tắt), kết thúc bằng commit nhỏ Conventional Commits tiếng Việt (`feat(order)/fix(shop)...`), xem `git diff` trước commit, lỗi đọc `docker logs` + tab Network.
- **Lý do**: Ví dụ thật — tìm `boxRef` mất do merge bằng cách đọc 2 nhánh; `No static resource .../payment` do backend chạy bản cũ → restart; 403 hàng loạt do token chết sau reset DB → đăng nhập lại.
- **Phương án đã cân nhắc**: Commit gộp nhiều mảng — loại, đề xuất thêm `commit-linter` chặn.

## Hiện trạng code (đã khảo sát, auth ở 007)

- `OrderController.java:28-111`, `OrderServiceImpl.java:89-244`, `PaymentServiceImpl.java:30-122`, `PaymentConfirmRequest.java:6-9`.
- `pages/shop/Checkout.jsx:54-202`, `pages/shop/PaymentModal.jsx:31-398`, `pages/shop/OrderHistory.jsx:48-274`, `OrderSuccess.jsx:28-127`.
- Test: `OrderServiceTests.java:84-218`, `PaymentServiceTest.java:54-170`, `PaymentWebhookConcurrencyTest.java:59-61`.
