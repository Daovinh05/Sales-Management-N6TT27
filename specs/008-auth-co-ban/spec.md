# Đặc tả tính năng (hồi tố): Đăng ký, đăng nhập, đăng xuất

**Nhánh tính năng**: `008-auth-co-ban`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft (hồi tố)

**Đầu vào**: Tách từ `007-auth-dang-nhap` (US1–US3). Quên mật khẩu tách riêng `009-quen-mat-khau`.

> Code đã có trên `main` + 1 fix thật đợt này: `logout()` FE gọi revoke server (trước chỉ xóa local).

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Đăng ký (Ưu tiên: P1)

`RegisterModal`: username 3–50, password ≥ 6, nhập lại khớp (sai → "Nhập lại mật khẩu chưa khớp", chưa gọi API), email đúng dạng, phone strip non-digit → `POST /api/auth/register`. 201 `{id,username,"Đăng ký thành công"}` (role `ROLE_CUSTOMER`, `ACTIVE`, BCrypt); trùng → 400; sai trường → 400 message riêng.

**Kịch bản chấp nhận**:

1. **Cho** payload hợp lệ mới, **Khi** đăng ký, **Thì** 201, password BCrypt.
2. **Cho** username < 3 / password < 6 / email sai / phone chữ, **Khi** đăng ký, **Thì** 400 đúng message.
3. **Cho** trùng username/email, **Khi** đăng ký, **Thì** 400 "đã được sử dụng".

---

### Chuyện 2 - Đăng nhập + tự gia hạn (Ưu tiên: P1)

`POST /api/auth/login` → `{token 30p, refreshToken 7 ngày, id, username, email, roles}` lưu 3 key; sai → 401 "Sai username hoặc password". `api.js` gắn Bearer; 401/403 (trừ `/auth/*`, 1 retry) → refresh dedupe → thử lại; hỏng → xóa 3 key + `auth:expired` 1 lần → "Phiên đăng nhập đã hết hạn...".

**Kịch bản chấp nhận**:

1. **Cho** đúng thông tin, **Khi** login, **Thì** 200 đủ token + roles.
2. **Cho** access hết hạn còn refresh tốt, **Khi** gọi API, **Thì** tự thử lại thành công.
3. **Cho** refresh hỏng, **Khi** gọi API, **Thì** báo hết phiên đúng 1 toast.

---

### Chuyện 3 - Đăng xuất thu hồi server (Ưu tiên: P1)

`logout()` (`store/auth.jsx:94-108`): `POST /api/auth/logout` best-effort → xóa 3 key → về trang khách. Refresh cũ → 401.

**Kịch bản chấp nhận**:

1. **Cho** đang đăng nhập, **Khi** đăng xuất, **Thì** server revoke, local sạch.
2. **Cho** refresh đã revoke, **Khi** refresh, **Thì** 401.

## Yêu cầu *(bắt buộc)*

- **FR-001**: Validate BE là chốt chặn; FE chỉ chặn sớm.
- **FR-002**: Refresh xoay vòng (revoke cũ); logout revoke idempotent.
- **FR-003**: Secret trong `.env`; chữ tiếng Việt.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: `AuthServiceTests` xanh; refresh sau logout → 401.
- **SC-002**: Không token → 401 mọi API cần auth.

## Giả định

- Role admin gán tay/seed; SMTP xem 014.
