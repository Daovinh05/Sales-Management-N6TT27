# Tasks: Quên mật khẩu

- [ ] T1. Entity `PasswordResetToken` + repository (user, token unique, hết hạn, đã dùng). Kiểm tra: app khởi động, bảng tự tạo.
- [ ] T2. `PasswordResetService`: sinh token (thu hồi cũ trước), xác thực (tồn tại + chưa dùng + còn hạn). Kiểm tra: unit test 3 case xanh.
- [ ] T3. `AuthService.forgotPassword/resetPassword` + 2 endpoint public trong `AuthController`. Kiểm tra: curl 200 cả user tồn tại/không tồn tại.
- [ ] T4. Đặt lại sai mã/hết hạn/mã đã dùng → 400, mật khẩu cũ vẫn dùng được. Kiểm tra: curl từng case.
- [ ] T5. Form 2 bước trong `LoginModal` + link "Quên mật khẩu?". Kiểm tra: click tay full luồng, đăng nhập lại bằng mật khẩu mới.
- [ ] T6. `mvn test` xanh toàn bộ, commit theo rule.
