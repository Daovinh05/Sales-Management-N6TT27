# Contract: API quên / đặt lại mật khẩu

**Tính năng**: `009-quen-mat-khau`

- `POST /api/auth/forgot-password {username}` (alias `/password/forgot`, `/password/forgot-email {email}`) → luôn 200 "Nếu tài khoản tồn tại, mã đã được gửi"; kèm `resetToken` chỉ khi `mailSent=false`.
- `POST /api/auth/reset-password {token,newPassword}` (alias `/password/reset`) → 200 "Đặt lại mật khẩu thành công, mời đăng nhập lại"; mã sai/hết hạn/đã dùng → 400.
