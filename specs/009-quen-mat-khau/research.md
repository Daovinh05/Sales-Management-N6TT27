# Research (hồi tố): Quên mật khẩu

**Ngày**: 2026-10-15 | **Tính năng**: `009-quen-mat-khau` (tách từ 007)

## Quyết định 1: Luôn 200 chống dò + mã demo khi chưa SMTP

- **Quyết định**: User không tồn tại vẫn cùng message; `resetToken` chỉ khi `mailSent=false`.
- **Lý do**: Không lộ user; chưa SMTP vẫn demo, có SMTP tự ẩn mã.
- **Phương án đã cân nhắc**: 404 khi user không tồn tại — loại vì lộ thông tin.

## Quyết định 2: Mã 1 lần có hạn

- **Quyết định**: Sai/hết hạn/đã dùng → 400; xong bắt đăng nhập lại.
- **Lý do**: Chống tái dùng mã.

## Hiện trạng code

`AuthController.java:52-77`, `AuthServiceImpl.java:111-150`, `PasswordResetService`, `MailService`, `AuthModal.jsx` (forgot 2 bước). Test: `PasswordResetServiceTests`, case demo/đã-cấu-hình-mail.
