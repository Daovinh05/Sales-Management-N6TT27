# Đặc tả tính năng (hồi tố): Đăng ký, đăng nhập, đăng xuất

**Nhánh tính năng**: `007-auth-dang-nhap`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Superseded (hồi tố)

> **Đã tách nhỏ**: nội dung spec này được thay bằng `008-auth-co-ban` (đăng ký/đăng nhập/đăng xuất) và `009-quen-mat-khau` (quên/đặt lại MK). File này giữ lại làm lịch sử, không dùng để implement.

**Đầu vào**: Ghi lại phần auth của Đào Văn Vinh đã triển khai trên `main`: đăng ký, đăng nhập (JWT access 30p + refresh xoay vòng 7 ngày), đăng xuất (revoke server), quên/đặt lại mật khẩu, tự gia hạn phiên ở frontend.

> **Ghi chú hồi tố**: Code đã có trên `main`. Artifact này viết sau để chứng minh quy trình SRS → plan → từng task và việc dùng skill (explore, soạn commit, diff + log). Đợt này có 1 fix thật: `logout()` FE trước đây chỉ xóa local, nay đã gọi `POST /api/auth/logout` thu hồi refresh server.

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Đăng ký tài khoản (Ưu tiên: P1)

Khách mở `RegisterModal` (`frontend/src/components/auth/AuthModal.jsx`): nhập username (3–50 ký tự), password (≥ 6 ký tự), nhập lại password (FE check khớp trước, sai → "Nhập lại mật khẩu chưa khớp", chưa gọi API), email (đúng định dạng), phone (FE strip ký tự không phải số) → `POST /api/auth/register` (`RegisterRequest.java:13-28`: `@Size`, `@Email`, `@Pattern("[0-9]*")`). Thành công → 201 `{id,username,message:"Đăng ký thành công"}`, server gán `ROLE_CUSTOMER` + `status = ACTIVE`, password BCrypt; FE báo "Đăng ký thành công, mời đăng nhập".

**Vì sao ưu tiên này**: Không có tài khoản thì không có luồng nào phía sau; validation 2 lớp (FE chặn sớm + BE chặn chắc).

**Kiểm thử độc lập**: `curl POST /api/auth/register` với payload hợp lệ → 201; payload sai từng trường → 400 message tiếng Việt tương ứng.

**Kịch bản chấp nhận**:

1. **Cho** username/email mới hợp lệ, **Khi** `POST /api/auth/register`, **Thì** 201, role `ROLE_CUSTOMER`, password đã BCrypt (không lưu plain).
2. **Cho** username < 3 ký tự / password < 6 ký tự / email sai / phone có chữ, **Khi** đăng ký, **Thì** 400 kèm message tiếng Việt từng trường.
3. **Cho** username/email đã dùng, **Khi** đăng ký lại, **Thì** 400 "Tên đăng nhập đã được sử dụng" / "Email đã được sử dụng".
4. **Cho** FE nhập lại password khác, **Khi** bấm đăng ký, **Thì** chặn ngay "Nhập lại mật khẩu chưa khớp", chưa gọi API.

---

### Chuyện 2 - Đăng nhập + tự gia hạn phiên (Ưu tiên: P1)

Khách nhập username/password ở `LoginModal` → `POST /api/auth/login` → `AuthServiceImpl.login` (`AuthenticationManager.authenticate` → `JwtProvider.generateToken` HS512 + `RefreshTokenService.create`) → `{token (access 30p), refreshToken (7 ngày), id, username, email, roles}` lưu 3 key localStorage. Sai thông tin → 401, UI báo "Sai username hoặc password". Mọi request sau gắn Bearer (`services/api.js:37-41`); gặp 401/403 (trừ chính request `/auth/*`) → `POST /auth/refresh` 1 lần (dedupe `refreshRequest`) rồi thử lại; refresh hỏng → xóa 3 key + phát `auth:expired` 1 lần (chống toast trùng) → `store/auth.jsx:12-19` báo "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại".

**Vì sao ưu tiên này**: Cửa vào mọi luồng khác; refresh xoay vòng (revoke cũ khi cấp mới) chống replay.

**Kiểm thử độc lập**: Login đúng → có `token`; sai password → 401; access hết hạn còn refresh hợp lệ → API tự thử lại thành công, người dùng không bị văng.

**Kịch bản chấp nhận**:

1. **Cho** đúng username/password, **Khi** `POST /api/auth/login`, **Thì** 200 đủ `token + refreshToken + roles`.
2. **Cho** sai password, **Khi** đăng nhập, **Thì** 401 và UI báo "Sai username hoặc password".
3. **Cho** access hết hạn còn refresh hợp lệ, **Khi** gọi API, **Thì** tự refresh và thử lại 1 lần.
4. **Cho** refresh hết hạn/đã revoke, **Khi** gọi API, **Thì** xóa session + báo hết phiên đúng 1 lần.

---

### Chuyện 3 - Đăng xuất thu hồi server (Ưu tiên: P1)

Khách bấm Đăng xuất (`ShopLayout.jsx:37`, `CustomerHeader.jsx:206`) → `logout()` (`store/auth.jsx:94-108`) gọi `POST /api/auth/logout {refreshToken}` thu hồi refresh trên server (best-effort: lỗi mạng vẫn xóa local trong `finally` để người dùng thoát được) → xóa 3 key localStorage, `setUser(null)`, về trang khách. Refresh cũ sau đó gọi `/auth/refresh` → 401.

**Vì sao ưu tiên này**: Chỉ xóa local thì token cũ vẫn sống 7 ngày trên server — thu hồi mới đăng xuất thật.

**Kiểm thử độc lập**: Đăng nhập → đăng xuất → dùng refresh cũ gọi `/auth/refresh` → 401; local đã sạch 3 key.

**Kịch bản chấp nhận**:

1. **Cho** đang đăng nhập, **Khi** bấm Đăng xuất, **Thì** server revoke refresh, local sạch, về trang khách.
2. **Cho** đã đăng xuất (kể cả khi mất mạng lúc bấm), **Khi** kiểm tra local, **Thì** không còn token nào.
3. **Cho** refresh đã revoke, **Khi** gọi `/auth/refresh`, **Thì** 401.

---

### Chuyện 4 - Quên / đặt lại mật khẩu (Ưu tiên: P2)

Khách quên mật khẩu làm 2 bước trong modal: `POST /api/auth/forgot-password {username}` (alias `/password/forgot`, `/password/forgot-email {email}`) luôn 200 "Nếu tài khoản tồn tại, mã đã được gửi" kể cả user không tồn tại (chống dò tài khoản); chưa cấu hình SMTP → kèm `resetToken` demo (banner vàng "Mã demo (chưa có SMTP): ..."); đã cấu hình → gửi mail, ẩn mã. Nhập mã + mật khẩu mới → `POST /api/auth/reset-password {token, newPassword}` → "Đặt lại mật khẩu thành công, mời đăng nhập lại".

**Vì sao ưu tiên này**: Khách quên mật khẩu vẫn tự phục hồi được; demo được cả khi chưa có SMTP.

**Kiểm thử độc lập**: User không tồn tại → vẫn 200 cùng message; chưa SMTP → có `resetToken`; đã SMTP → không lộ mã.

**Kịch bản chấp nhận**:

1. **Cho** username không tồn tại, **Khi** quên mật khẩu, **Thì** vẫn 200 cùng message (không lộ user tồn tại hay không).
2. **Cho** chưa cấu hình mail, **Khi** quên mật khẩu user thật, **Thì** response kèm `resetToken` demo.
3. **Cho** mã đúng, **Khi** đặt lại mật khẩu, **Thì** 200 và đăng nhập bằng mật khẩu mới được.

## Yêu cầu *(bắt buộc)*

### Yêu cầu chức năng

- **FR-001**: `POST /api/auth/register` PHẢI validate (`RegisterRequest`: username 3–50, password ≥ 6, email đúng dạng, phone chỉ số) message tiếng Việt; tạo user `ROLE_CUSTOMER` + `ACTIVE` + BCrypt; trùng → 400 tiếng Việt.
- **FR-002**: `POST /api/auth/login` PHẢI trả access (30p) + refresh (7 ngày); sai → 401.
- **FR-003**: `POST /api/auth/refresh` PHẢI xoay vòng (revoke cũ, cấp mới); token hỏng/revoke → 401.
- **FR-004**: `POST /api/auth/logout` PHẢI revoke refresh (idempotent); FE PHẢI gọi API best-effort rồi mới xóa local.
- **FR-005**: Quên mật khẩu PHẢI luôn 200 cùng message (chống dò); chỉ lộ mã demo khi chưa gửi được mail.
- **FR-006**: `JwtFilter` + `SecurityConfig` PHẢI chặn mọi endpoint ngoài whitelist; 401 JSON "Chưa đăng nhập hoặc token hết hạn"; secret chỉ trong `.env`.
- **FR-007**: FE PHẢI tự refresh 1 lần + báo hết phiên 1 lần (`auth:expired`); mọi chữ UI/message tiếng Việt.

### Thực thể chính

- **User**: `username` UK, `email` UK, `password` BCrypt, `status`; quan hệ `User—UserRole—Role`, `User—RefreshToken`.
- **RefreshToken**: `token` UK, `expires_at` (7 ngày), `revoked` — revoke khi refresh xoay vòng và khi logout.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: `mvn -Dtest='AuthServiceTests,PasswordResetServiceTests' test` xanh.
- **SC-002**: 100% payload sai validation bị 400 đúng message từng trường; 100% dò user qua forgot-password bị chặn (luôn 200 giống nhau).
- **SC-003**: Refresh sau logout → 401; hết phiên báo đúng 1 toast.
- **SC-004**: Không token → 401; secret không nằm trong git.

## Giả định

- Chưa có SMTP thật nên giữ chế độ mã demo; có SMTP thì ẩn mã (logic đã có, theo `mailSent`).
