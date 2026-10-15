# Quickstart (hồi tố): Quên mật khẩu

**Tính năng**: `009-quen-mat-khau` | Contract: [password-reset](./contracts/password-reset-api.md)

```bash
curl -s -X POST http://localhost:8080/api/auth/forgot-password -H "Content-Type: application/json" \
  -d '{"username":"nguoi_khong_ton_tai"}'; echo
# Kỳ vọng: 200 cùng message (không lộ)
curl -s -X POST http://localhost:8080/api/auth/forgot-password -H "Content-Type: application/json" \
  -d '{"username":"customer"}'; echo
# Kỳ vọng: 200 + resetToken demo (chưa SMTP)
curl -s -X POST http://localhost:8080/api/auth/reset-password -H "Content-Type: application/json" \
  -d '{"token":"MA_DEMO","newPassword":"654321"}'; echo
# Kỳ vọng: 200, login bằng MK mới được
```

UI: modal quên MK 2 bước + banner mã demo. Test: `mvn -Dtest='PasswordResetServiceTests' test`.
