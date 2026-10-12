# Kế hoạch: Quên mật khẩu

## Kiến trúc
- Backend: entity `PasswordResetToken` (giống mẫu `RefreshToken`); `PasswordResetService`; 2 endpoint mới trong `AuthController`; `AuthService` thêm `forgotPassword`/`resetPassword`.
- Frontend: mở rộng `AuthModal.jsx` (mode `forgot`), không thêm trang mới.

## File tạo/sửa
| File | Việc |
|---|---|
| `entity/PasswordResetToken.java` (mới) | user, token unique, hết hạn, đã dùng |
| `repository/PasswordResetTokenRepository.java` (mới) | tìm theo token, thu hồi token cũ của user |
| `dto/request/ForgotPasswordRequest.java` (mới) | `{username}` + validation |
| `dto/request/ResetPasswordRequest.java` (mới) | `{token, newPassword min 6}` |
| `service/PasswordResetService.java` + impl (mới) | sinh token, xác thực token |
| `service/AuthService.java`, `AuthServiceImpl.java` | thêm 2 phương thức |
| `controller/AuthController.java` | 2 endpoint public `/forgot-password`, `/reset-password` |
| `config/SecurityConfig.java` | cho phép 2 endpoint (đã permit `/api/auth/**` — kiểm tra lại) |
| `components/auth/AuthModal.jsx` | link + form 2 bước |
| `service/AuthServiceTests.java` (test) | 3 case: sinh token, mã sai, mã hết hạn |

## Thứ tự task
1. Entity + repository + migration tự động (`ddl-auto=update`).
2. Service sinh/xác thực token + unit test.
3. 2 endpoint + cho phép public.
4. Form quên mật khẩu trong modal đăng nhập.
5. Test tay đủ 4 tiêu chí trong spec.md.

## Rủi ro
- Quên thu hồi token cũ → user có nhiều mã hiệu lực: xử lý bằng revoke-all trước khi tạo mới.
- Lộ username tồn tại → luôn trả 200 giống nhau.
