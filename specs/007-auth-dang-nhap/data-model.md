# Mô hình dữ liệu (hồi tố): Đăng ký, đăng nhập, đăng xuất

**Tính năng**: `007-auth-dang-nhap` | **Ngày**: 2026-10-15

## Thực thể

| Thực thể | Trường chính | Ràng buộc |
|---|---|---|
| `User` | `username` UK (3–50), `email` UK (đúng dạng), `password` BCrypt (≥ 6), `status = ACTIVE`, `fullName/phone/address` | Trùng username/email → 400 tiếng Việt; phone chỉ số |
| `Role` / `UserRole` | `ROLE_CUSTOMER` ("Khách hàng mua hàng") | Đăng ký auto gán; admin gán tay trong DB/seed |
| `RefreshToken` | `token` UK, `expires_at` (7 ngày), `revoked` | Xoay vòng revoke cũ; logout revoke; dùng lại token revoke → 401 |
| `PasswordReset` | mã 1 lần + hạn + `used` | Sai/hết hạn/đã dùng → 400; đúng → đổi mật khẩu + bắt đăng nhập lại |

## Quy tắc kiểm chứng

- Validation BE là chốt chặn cuối (`@Valid` ở controller); FE chỉ chặn sớm cho UX.
- Quên mật khẩu không phân biệt user tồn tại hay không (cùng 200 + message).
- Secret JWT + cấu hình mail chỉ trong `.env`, không commit (kiểm tra `.gitignore` + `git log`).

## Quan hệ

- `User 1—n RefreshToken`; `User 1—n PasswordReset`; `User n—n Role` qua `UserRole`.
- ER tham khảo: `docs/Token.md` (`USER—USER_ROLE—ROLE`, `USER—REFRESH_TOKEN`).
