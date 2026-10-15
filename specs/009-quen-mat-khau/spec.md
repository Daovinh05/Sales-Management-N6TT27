# Đặc tả tính năng (hồi tố): Quên / đặt lại mật khẩu

**Nhánh tính năng**: `009-quen-mat-khau`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft (hồi tố)

**Đầu vào**: Tách từ `007-auth-dang-nhap` (US4).

> Code đã có trên `main`.

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Xin mã đặt lại (Ưu tiên: P1)

2 bước trong `AuthModal`: `POST /api/auth/forgot-password {username}` (alias `/password/forgot`, `/password/forgot-email {email}`) luôn 200 "Nếu tài khoản tồn tại, mã đã được gửi" kể cả user không tồn tại (chống dò). Chưa SMTP → kèm `resetToken` demo (banner vàng "Mã demo (chưa có SMTP): ..."); đã SMTP → gửi mail, ẩn mã.

**Kịch bản chấp nhận**:

1. **Cho** username không tồn tại, **Khi** xin mã, **Thì** vẫn 200 giống hệt (không lộ).
2. **Cho** chưa SMTP + user thật, **Khi** xin mã, **Thì** có `resetToken` demo.
3. **Cho** đã SMTP, **Khi** xin mã, **Thì** không lộ mã, mail được gửi.

---

### Chuyện 2 - Đặt lại bằng mã (Ưu tiên: P1)

Nhập mã + mật khẩu mới → `POST /api/auth/reset-password {token, newPassword}` → 200 "Đặt lại mật khẩu thành công, mời đăng nhập lại"; mã sai/hết hạn/đã dùng → 400. Đăng nhập bằng mật khẩu mới được.

**Kịch bản chấp nhận**:

1. **Cho** mã đúng còn hạn, **Khi** đặt lại, **Thì** 200, login mới được.
2. **Cho** mã sai/đã dùng, **Khi** đặt lại, **Thì** 400.

## Yêu cầu *(bắt buộc)*

- **FR-001**: Luôn 200 cùng message ở bước xin mã; mã 1 lần có hạn.
- **FR-002**: Chữ tiếng Việt.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: `PasswordResetServiceTests` xanh; không dò được user.
- **SC-002**: Demo được cả khi chưa SMTP.

## Giả định

- Có SMTP thật thì ẩn mã (theo `mailSent`, không đổi code).
