# Đặc tả tính năng: Thanh toán PayOS + VietQR

**Nhánh**: `feat/quen_mat_khau` (tiếp nối) | **Ngày**: 2026-10-12 | **Trạng thái**: Sẵn sàng implement (phần lõi đã dựng, còn 2 mục follow-up)

## Bối cảnh

Modal thanh toán hiện tại hiển thị QR VietQR gắn tài khoản demo và nút "Tôi đã chuyển khoản" — khách tự khai đã trả, hệ thống không có cách nào biết tiền thật đã về. Cần tích hợp cổng PayOS: tạo link/QR gắn đúng tài khoản shop và nhận webhook báo giao dịch thành công để đánh dấu đơn đã trả tiền.

## User stories

- **P1**: Khách chọn tab VietQR → nhận link/QR gắn đúng tài khoản shop (MB – 0389783619 – DAO VAN VINH) kèm đúng số tiền và nội dung là mã đơn → quét bằng app ngân hàng và chuyển khoản thật.
- **P1**: Khách chuyển khoản xong → PayOS bắn webhook → hệ thống verify chữ ký, khớp mã đơn + số tiền → đánh dấu đơn `paid`, màn hình modal tự báo thành công (polling 3 giây/lần).
- **P2**: Link hết hạn (mặc định 15 phút) → khách lấy mã mới mà không phải tạo lại đơn; đơn treo quá hạn chưa trả thì tự hủy để nhả hàng đã giữ.
- **P2**: Shop nhìn danh sách đơn biết đơn nào đã trả tiền để ưu tiên duyệt.

## Yêu cầu chức năng

- `POST /api/orders/{code}/vietqr-link` (xác thực, đúng chủ đơn, đơn `CHO_DUYET` chưa trả) → gọi PayOS tạo link (`orderCode` số nguyên duy nhất, `amount` nguyên VND, `description` = mã đơn rút gọn ≤ 25 ký tự) → lưu `payosOrderCode`/`paymentLinkId` vào đơn → trả `checkoutUrl`, thông tin thụ hưởng cho frontend. Mỗi lần gọi sinh mã mới; mã cũ không khớp thì webhook bỏ qua.
- `POST /api/payments/payos-webhook` (public, xác thực bằng chữ ký HMAC-SHA256) → chỉ xử lý khi `code == "00"`, tìm đơn theo `payosOrderCode`, đối chiếu số tiền → set `paid=true`, `paidAt`, `paymentMethod=VIETQR`. Gọi trùng thì bỏ qua (idempotent). Luôn trả HTTP 200, kết quả thật nằm trong body.
- Frontend: tab VietQR xin link → nút mở trang PayOS + bảng CK thủ công (số TK/tên thật từ PayOS) + polling `GET /api/orders/{code}/detail` tới khi `paid`. Chưa cấu hình key PayOS thì giữ luồng demo cũ.
- Đơn `CHO_DUYET` không tự chuyển trạng thái khi trả tiền; shop vẫn duyệt `DA_XAC_NHAN` → giao → hoàn thành (trừ kho thật ở hoàn thành, không đổi).

## Ràng buộc

- Ba key PayOS (`PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`) chỉ trong `.env`/biến môi trường, không commit; `.env.example` chỉ placeholder.
- Không tin giá client: số tiền lấy từ `paymentAmount` của đơn trong DB.
- Secret không xuất hiện trong log ở mọi mức.
- `returnUrl`/`cancelUrl` chỉ để hiển thị; nguồn duy nhất để chốt tiền là webhook.
- Webhook local phải qua HTTPS public (ngrok); PayOS không gọi được localhost.
- Mọi câu chữ UI/message tiếng Việt.

## Tiêu chí kiểm tra

- Tạo link đơn không phải của mình → 403; đơn đã trả/không còn chờ → 400.
- Webhook sai chữ ký/thiếu data/lệch tiền/mã lạ → HTTP 200 nhưng `success=false`, đơn không đổi.
- Webhook hợp lệ gọi 2 lần → `paid` vẫn đúng 1 lần, kho không bị trừ thêm.
- Chưa cấu hình key → tab VietQR vẫn dùng được luồng demo, không crash.
- `mvn test` xanh (gồm test chữ ký HMAC và các kịch bản webhook).
