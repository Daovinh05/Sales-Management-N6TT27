# Nghiên cứu: Quên mật khẩu

## Quyết định

- Sử dụng luồng reset mật khẩu dựa trên email với token lưu trữ trong MySQL và thời hạn 15 phút.
- Lưu token dưới dạng hash (SHA-256 hoặc UUID + hash) thay vì lưu giá trị gốc để giảm rủi ro lộ token trong database.
- Tạo endpoint REST riêng cho `POST /api/auth/password/forgot` và `POST /api/auth/password/reset` để phù hợp với kiến trúc Spring Boot hiện tại.
- Thêm dependency `spring-boot-starter-mail` cho việc gửi email, cùng cấu hình SMTP trong `.env` / application properties.

## Lý do

- Dự án hiện đã có `User.email` và `AuthController`, nên không cần thay đổi mô hình người dùng lớn.
- Kiến trúc hiện tại tuân theo Controller → Service → Repository, nên tiếp tục đặt logic reset mật khẩu trong service layer và repository.
- Email là kênh khôi phục an toàn nhất cho hệ thống bán hàng và đã phù hợp với các yêu cầu xác thực tài khoản hiện có.
- Cách token lưu trong database dễ tích hợp với JPA và dễ kiểm thử hơn so với biện pháp dùng câu hỏi bảo mật.

## Phương án đã cân nhắc

1. Reset bằng câu hỏi bảo mật
   - Ưu điểm: không cần email.
   - Nhược điểm: không phù hợp với mô hình quản lý người dùng hiện có và dễ bị quên/khó bảo mật.
   - Kết luận: loại bỏ vì không phù hợp với dữ liệu ứng dụng hiện tại.

2. Admin reset trực tiếp bằng tài khoản quản trị
   - Ưu điểm: triển khai nhanh.
   - Nhược điểm: không cho người dùng tự khôi phục và không giải quyết yêu cầu trải nghiệm khách hàng.
   - Kết luận: chỉ dùng như phương án dự phòng, không phải MVP.

3. Reset bằng link 1 lần với OTP trên email
   - Ưu điểm: an toàn và thân thiện với người dùng.
   - Nhược điểm: cần thêm state token và lưu lịch sử.
   - Kết luận: chọn phương án token + email vì phù hợp với cấu trúc hiện có.
