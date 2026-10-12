# Đặc tả tính năng: Quên mật khẩu

**Nhánh**: `001-forgot-password` | **Ngày**: 2026-10-12 | **Trạng thái**: Sẵn sàng implement

## Bối cảnh
Khách quên mật khẩu hiện không có cách nào lấy lại ngoài nhờ admin sửa tay trong DB.
Cần luồng "Quên mật khẩu" tự phục vụ trong modal đăng nhập.

## User stories
- **P1**: Khách nhập username/email → nhận mã đặt lại (demo: hiển thị mã trên màn hình + ghi log; production gắn SMTP sau).
- **P1**: Khách nhập mã + mật khẩu mới (≥ 6 ký tự) → đổi mật khẩu, mã vô hiệu, đăng nhập lại được ngay.
- **P2**: Mã sai/hết hạn (15 phút) → báo lỗi rõ ràng, không đổi mật khẩu.

## Yêu cầu chức năng
- `POST /api/auth/forgot-password` {username} → tạo token ngẫu nhiên, hết hạn 15 phút, 1 user chỉ 1 token hiệu lực (thu hồi token cũ).
- `POST /api/auth/reset-password` {token, newPassword} → kiểm tra token (tồn tại, chưa dùng, còn hạn) → mã hóa BCrypt mật khẩu mới → đánh dấu token đã dùng.
- Frontend: link "Quên mật khẩu?" trong `LoginModal` → form 2 bước (xin mã → đặt lại), thông báo tiếng Việt.
- Không cho biết username có tồn tại hay không (chống dò tài khoản): luôn trả "Nếu tài khoản tồn tại, mã đã được gửi".

## Ràng buộc
- Không thêm SMTP (ngoài phạm vi đồ án); mã demo trả về để test, kèm `@Profile` hoặc cờ để tắt ở production.
- Mật khẩu mới tuân thủ rule hiện hành (≥ 6 ký tự).
- Token dùng 1 lần, hết hạn 15 phút.

## Tiêu chí kiểm tra
- Xin mã user không tồn tại → vẫn 200, không lộ thông tin.
- Đặt lại bằng mã sai/hết hạn/đã dùng → 400, mật khẩu cũ vẫn đăng nhập được.
- Đặt lại đúng → đăng nhập bằng mật khẩu mới được, mật khẩu cũ không được.
- Unit test service tạo/xác thực token (Mockito, không cần DB).
