# Quickstart: Kiểm tra tính năng quên mật khẩu

## Điều kiện tiên quyết

- Backend Spring Boot đang chạy trên `http://localhost:8080`
- Frontend React đang chạy trên `http://localhost:5173`
- Cấu hình SMTP đã được thiết lập trong `.env` hoặc `application.properties`
- Có ít nhất một tài khoản người dùng có email đã đăng ký trong hệ thống

## Kịch bản 1: Yêu cầu reset

1. Truy cập màn hình đăng nhập.
2. Chọn tính năng "Quên mật khẩu".
3. Nhập email hợp lệ của tài khoản.
4. Gửi yêu cầu.
5. Kết quả mong đợi: hệ thống trả về thông báo thành công và email chứa link/token reset được gửi đi.

## Kịch bản 2: Đặt lại mật khẩu mới

1. Mở email nhận được từ hệ thống.
2. Nhấp vào link reset hoặc sao chép token.
3. Điền mật khẩu mới và xác nhận.
4. Gửi yêu cầu lên `POST /api/auth/password/reset`.
5. Kết quả mong đợi: hệ thống cập nhật mật khẩu, vô hiệu hóa token cũ và báo thành công.

## Kịch bản 3: Xử lý lỗi

1. Gửi token hết hạn hoặc sai.
2. Kết quả mong đợi: API trả về lỗi `400` hoặc `404` với message tiếng Việt rõ ràng.
3. Gửi nhiều yêu cầu reset cho cùng email.
4. Kết quả mong đợi: không có token cũ còn hiệu lực sau khi tạo token mới.

## Gợi ý curl

```bash
curl -X POST http://localhost:8080/api/auth/password/forgot \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com"}'

curl -X POST http://localhost:8080/api/auth/password/reset \
  -H 'Content-Type: application/json' \
  -d '{"token":"TOKEN_CUA_BAN","newPassword":"newPassword123"}'
```

## Kết quả mong đợi

- API forgot trả về phản hồi an toàn, không tiết lộ trạng thái tài khoản nếu email không tồn tại.
- API reset chỉ chấp nhận token hợp lệ và cập nhật mật khẩu thành công.
- Sau cập nhật, người dùng có thể đăng nhập bằng mật khẩu mới.
