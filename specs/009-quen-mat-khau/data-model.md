# Mô hình dữ liệu (hồi tố): Quên mật khẩu

**Tính năng**: `009-quen-mat-khau` | **Ngày**: 2026-10-15

| Thực thể | Trường chính | Ràng buộc |
|---|---|---|
| `PasswordReset` | mã 1 lần + hạn + `used` | Sai/hết hạn/đã dùng → 400 |

Quy tắc: xin mã luôn 200 cùng message (chống dò); `resetToken` chỉ lộ khi `mailSent=false`; xong bắt đăng nhập lại.
