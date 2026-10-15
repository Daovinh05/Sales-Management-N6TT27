# Contract: API Auth (đăng ký / đăng nhập / đăng xuất)

**Tính năng**: `007-auth-dang-nhap` | File: `backend/.../controller/AuthController.java:26-77`, `store/auth.jsx`, `services/api.js:37-68`

## Đăng ký — `POST /api/auth/register` → 201

Request (`RegisterRequest.java:13-28`):
- `username`: `@NotBlank` + `@Size(3-50)` — "Username không được để trống" / "Username phải từ 3-50 ký tự"
- `password`: `@NotBlank` + `@Size(min=6)` — "Password không được để trống" / "Password phải ít nhất 6 ký tự"
- `email`: `@Email` — "Email không hợp lệ" (optional)
- `phone`: `@Pattern("[0-9]*")` — "Số điện thoại chỉ được chứa chữ số" (FE strip non-digit trước khi gửi)
- `fullName`, `address`: tự do

Response: 201 `{id, username, message:"Đăng ký thành công"}` (role `ROLE_CUSTOMER`, `status=ACTIVE`, BCrypt).
Lỗi: 400 validation từng trường; 400 "Tên đăng nhập đã được sử dụng" / "Email đã được sử dụng".
FE: `RegisterModal` check `password == confirm` trước ("Nhập lại mật khẩu chưa khớp") → `register()` → notify "Đăng ký thành công, mời đăng nhập".

## Đăng nhập — `POST /api/auth/login` → 200

Request `{username, password}` → 200 `{token, refreshToken, id, username, email, roles}`; sai → 401, UI "Sai username hoặc password".
FE `login()` lưu 3 key `accessToken/refreshToken/user` → notify "Đăng nhập thành công".

## Gia hạn — `POST /api/auth/refresh {refreshToken}` → 200

Xoay vòng: revoke token cũ, cấp cặp mới (chống replay). Hết hạn/đã revoke → 401.
FE `api.js`: request gắn Bearer; 401/403 (trừ `/auth/*`, tối đa 1 retry) → refresh dedupe → thử lại; hỏng → xóa 3 key + `auth:expired` 1 lần (chống toast trùng).

## Đăng xuất — `POST /api/auth/logout {refreshToken}` → 200

`{"message":"Đăng xuất thành công"}` (revoke idempotent).
FE `logout()` (`store/auth.jsx:94-108`): gọi API best-effort (lỗi mạng vẫn thoát local) → xóa 3 key → `setUser(null)`. Refresh cũ sau đó 401.

## Quên / đặt lại mật khẩu

- `POST /api/auth/forgot-password {username}` (alias `/password/forgot`, `/password/forgot-email {email}`) → luôn 200 "Nếu tài khoản tồn tại, mã đã được gửi" (chống dò tài khoản); chỉ kèm `resetToken` demo khi `mailSent=false`.
- `POST /api/auth/reset-password {token, newPassword}` (alias `/password/reset`) → 200 "Đặt lại mật khẩu thành công, mời đăng nhập lại".

## Bảo vệ chung (`SecurityConfig.java:37-61`)

`permitAll`: `/api/auth/**`, `/api/payments/payos-webhook`, `GET` catalog/storefront, `/uploads/**`; còn lại authenticated, stateless, 401 JSON "Chưa đăng nhập hoặc token hết hạn".
