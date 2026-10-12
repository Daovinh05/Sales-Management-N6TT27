# Mô hình dữ liệu: Quên mật khẩu

## Thực thể chính

### User

- `id`: Long
- `username`: String, unique, không được để trống
- `password`: String, lưu hash mật khẩu
- `email`: String, unique, dùng cho reset mật khẩu
- `fullName`: String
- `phone`: String
- `status`: String, ví dụ ACTIVE / LOCKED
- `createdAt`, `updatedAt`: LocalDateTime

### PasswordResetToken

- `id`: Long
- `userId`: Long, khóa ngoại tới `User`
- `tokenHash`: String, hash giá trị token thực sự
- `expiresAt`: LocalDateTime
- `usedAt`: LocalDateTime, nullable
- `createdAt`: LocalDateTime
- `status`: Enum/ String với các giá trị: REQUESTED, USED, EXPIRED, REVOKED

## Quan hệ

- `User` 1 - N `PasswordResetToken`
- Một user có thể có nhiều token lịch sử, nhưng chỉ một token đang hoạt động được phép sử dụng tại một thời điểm.

## Quy tắc kiểm tra

- Mỗi yêu cầu reset phải có email hợp lệ và tài khoản đang ACTIVE.
- Token chỉ hợp lệ khi `status = REQUESTED` và `expiresAt > now`.
- Sau khi xác thực thành công, token bị chuyển `USED` và không còn hợp lệ cho lần tiếp theo.
- Nếu token quá hạn hoặc bị đánh dấu `REVOKED`, API phải từ chối ngay.

## Chuyển trạng thái

```text
REQUESTED -> USED
REQUESTED -> EXPIRED
REQUESTED -> REVOKED
```

## Gợi ý lưu trữ

- Bảng `password_reset_token` nên được giữ riêng khỏi `users` để dễ audit và cleanup tự động.
- Có thể thêm job cron hoặc cleanup task định kỳ để xóa token hết hạn cũ.
