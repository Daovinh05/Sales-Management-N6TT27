# Research (hồi tố): Đăng ký, đăng nhập, đăng xuất

**Ngày**: 2026-10-15 | **Tính năng**: `007-auth-dang-nhap`

## Quyết định 1: JWT access ngắn + refresh xoay vòng dài

- **Quyết định**: Access 30p (HS512, subject=username) + refresh 7 ngày lưu DB; mỗi lần refresh revoke cũ cấp mới; logout revoke.
- **Lý do**: Access ngắn giảm rủi ro lộ token; refresh xoay vòng chống replay mà người dùng không phải đăng nhập lại trong 7 ngày.
- **Phương án đã cân nhắc**: Session server — loại vì backend stateless, scale đơn giản hơn.

## Quyết định 2: Validate 2 lớp, message tiếng Việt từng trường

- **Quyết định**: FE chặn sớm (khớp password, strip phone, banner demo) + BE `@Valid` chặn chắc (`RegisterRequest`: username 3–50, password ≥ 6, `@Email`, phone số).
- **Lý do**: Gọi API trực tiếp vẫn bị chặn (đã test tay sai từng trường); ví dụ trong README "ràng buộc mật khẩu phải có @" chỉ cần thêm `@Pattern` vào DTO đúng mẫu `OrderStatusRequest`.
- **Phương án đã cân nhắc**: Chỉ validate FE — loại vì bypass được bằng curl.

## Quyết định 3: Quên mật khẩu luôn 200 chống dò + mã demo khi chưa SMTP

- **Quyết định**: User không tồn tại vẫn 200 cùng message; chỉ trả `resetToken` khi `mailSent=false`.
- **Lý do**: Không lộ user nào tồn tại; đồ án chưa SMTP vẫn demo được, có SMTP thì tự ẩn mã không đổi code.
- **Phương án đã cân nhắc**: 404 khi user không tồn tại — loại vì lộ thông tin.

## Quyết định 4: Auto-refresh dedupe + báo hết phiên 1 lần

- **Quyết định**: `api.js` gom concurrent 401 về 1 request refresh (`refreshRequest`); hỏng → xóa 3 key + `auth:expired` 1 lần (check `hadSession`).
- **Lý do**: Trước đây toast trùng khi nhiều request cùng 401 (đã fix, commit `fix(frontend-auth): báo hết phiên... chống toast trùng`).
- **Phương án đã cân nhắc**: Mỗi request tự refresh — loại vì race + spam toast.

## Quyết định 5: Đăng xuất thu hồi server (fix thật đợt này)

- **Quyết định**: `logout()` gọi `POST /api/auth/logout` best-effort (try/catch, xóa local trong mọi đường) thay vì chỉ xóa local như trước.
- **Lý do**: Chỉ xóa local thì refresh còn sống 7 ngày — ai giữ token vẫn refresh được. Fix 1 hàm, caller `onClick={logout}` không đổi vẫn chạy (async tương thích handler sync).
- **Phương án đã cân nhắc**: Giữ nguyên chỉ xóa local — loại vì lý do bảo mật trên.

## Hiện trạng code (đã khảo sát)

- `AuthController.java:26-77`, `AuthServiceImpl.java:49-150`, `JwtFilter.java:26-48`, `JwtProvider.java:18-58`, `SecurityConfig.java:37-61`, `docs/Token.md:1-39`.
- `RegisterRequest.java:13-28` (+ Login/Refresh/ForgotPassword/ResetPasswordRequest).
- `store/auth.jsx:7-108`, `services/api.js:1-68`, `components/auth/AuthModal.jsx:21-192`, `ShopLayout.jsx:37`, `CustomerHeader.jsx:206`.
- Test: `AuthServiceTests.java:73-174`, `PasswordResetServiceTests`, `PayosApiClientTest` (liên quan cấu hình mail).
