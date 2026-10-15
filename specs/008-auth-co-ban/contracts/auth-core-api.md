# Contract: API auth cơ bản

**Tính năng**: `008-auth-co-ban`

- `POST /api/auth/register` → 201 `{id,username,"Đăng ký thành công"}`; validation 400 từng trường (username 3–50, password ≥ 6, email, phone số); trùng → 400.
- `POST /api/auth/login {username,password}` → 200 `{token,refreshToken,id,username,email,roles}`; sai → 401.
- `POST /api/auth/refresh {refreshToken}` → cặp mới (revoke cũ); hỏng → 401.
- `POST /api/auth/logout {refreshToken}` → 200 "Đăng xuất thành công" (idempotent).
- Whitelist `SecurityConfig`: `/api/auth/**`, webhook PayOS, `GET` catalog/storefront, `/uploads/**`; còn lại 401 JSON tiếng Việt.
