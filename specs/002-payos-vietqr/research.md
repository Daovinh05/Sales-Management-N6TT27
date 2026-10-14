# Nghiên cứu: Thanh toán PayOS + VietQR

Mọi NEEDS CLARIFICATION đã được giải quyết trong lúc thăm dò cùng user + docs PayOS chính thức (payos.vn/docs). Không còn điểm mờ.

## Quyết định

- **Cổng thanh toán: PayOS (miễn phí) thay vì tự đọc sao kê ngân hàng.**
  - Lý do: tài khoản cá nhân không có webhook/API ngân hàng; PayOS cung cấp tạo link + webhook xác thực chữ ký, có chế độ test, tài liệu tiếng Việt, hợp đồ án. Đã verify thực tế: tạo link, verify ký, webhook, đối chiếu tiền đều chạy trên docker.
- **Tài khoản nhận tiền: MB – 0389783619 – DAO VAN VINH.**
  - Lý do: user xác nhận đây là tài khoản thật của mình; kênh PayOS sẽ liên kết đúng số này để đồng nhất với QR demo. Số TK/tên thụ hưởng là thông tin công khai với khách nên để trong code được.
- **Chữ ký: HMAC-SHA256 trên chuỗi `key=value` nối `&`, key xếp alphabet, null thành rỗng, không encode URL, hex chữ thường.**
  - Lý do: đúng thuật toán docs PayOS cho cả chiều tạo link và chiều verify webhook; dùng chung một hàm `sign` cho cả hai chiều. Không dùng SDK ngoài để khỏi thêm dependency, chỉ cần `RestTemplate` + `javax.crypto` có sẵn.
- **Nguồn chốt tiền duy nhất: webhook.** `returnUrl`/`cancelUrl` chỉ để hiển thị.
  - Lý do: khách có thể tắt trang sau khi trả; chỉ webhook (có chữ ký) mới đáng tin.
- **Mô hình trạng thái: thêm cờ `paid` trực giao, shop vẫn duyệt tay.**
  - Lý do: giữ nguyên máy trạng thái đơn + luồng kho (constitution IV); webhook chỉ set `paid`, không tự chuyển `CHO_DUYET → DA_XAC_NHAN`.
- **Chưa cấu hình key: fallback luồng demo cũ (tự bấm đã chuyển khoản).**
  - Lý do: app vẫn demo được offline; khi có key thì luồng PayOS thay thế, mã demo bị ẩn.
- **Webhook local qua ngrok (HTTPS public).**
  - Lý do: PayOS không gọi được localhost; ngrok là cách chuẩn để thử webhook ở máy cá nhân.

## Phương án đã cân nhắc

1. **Sepay (webhook biến động số dư theo nội dung CK)**
   - Ưu điểm: webhook trực tiếp từ giao dịch vào, không cần tạo link trước.
   - Nhược điểm: user đã chọn PayOS sau khi so sánh; luồng tạo link của PayOS khớp sẵn modal hiện tại (hiện QR + polling).
   - Kết luận: loại, giữ PayOS.
2. **Tự đối soát sao kê / API ngân hàng**
   - Ưu điểm: không phụ thuộc bên thứ ba.
   - Nhược điểm: ngân hàng không cấp webhook/API cho tài khoản cá nhân; polling sao kê thủ công không realtime và dễ sai.
   - Kết luận: loại vì bất khả thi với tài khoản cá nhân.
3. **Giữ nút "Tôi đã chuyển khoản" + admin duyệt tay**
   - Ưu điểm: không cần tích hợp gì.
   - Nhược điểm: gian lận tự khai đã trả; admin đối soát sao kê thủ công từng đơn.
   - Kết luận: giữ làm fallback khi chưa cấu hình key, không phải luồng chính.
4. **Tự trừ tiền/cộng ví nội bộ khi webhook về**
   - Ưu điểm: có số dư nội bộ để đối soát.
   - Nhược điểm: tiền thật nằm ở ngân hàng ngoài hệ thống; ví nội bộ gây lệch 2 sổ, vượt phạm vi đồ án.
   - Kết luận: loại; hệ thống chỉ ghi nhận `paid=true`.
