# Mô hình dữ liệu (hồi tố): Auth cơ bản

**Tính năng**: `008-auth-co-ban` | **Ngày**: 2026-10-15

| Thực thể | Trường chính | Ràng buộc |
|---|---|---|
| `User` | `username` UK (3–50), `email` UK, `password` BCrypt (≥ 6), `status = ACTIVE` | Trùng → 400 tiếng Việt |
| `Role`/`UserRole` | `ROLE_CUSTOMER` | Đăng ký auto gán |
| `RefreshToken` | `token` UK, `expires_at` 7 ngày, `revoked` | Xoay vòng revoke cũ; logout revoke; dùng lại → 401 |

ER tham khảo: `docs/Token.md`.
