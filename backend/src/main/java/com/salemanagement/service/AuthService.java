package com.salemanagement.service;

import com.salemanagement.dto.request.LoginRequest;
import com.salemanagement.dto.request.RefreshRequest;
import com.salemanagement.dto.request.RegisterRequest;
import com.salemanagement.dto.response.JwtResponse;
import com.salemanagement.entity.User;

public interface AuthService {
    JwtResponse login(LoginRequest request);
    User register(RegisterRequest request);
    JwtResponse refresh(RefreshRequest request);
    void logout(String refreshToken);
    /**
     * Tạo mã đặt lại mật khẩu và gửi mail nếu cấu hình.
     * {@code resetToken} null khi user không tồn tại (chống dò tài khoản).
     */
    ForgotPasswordResult forgotPassword(String usernameOrEmail);
    void resetPassword(String token, String newPassword);

    record ForgotPasswordResult(String resetToken, boolean mailSent) {
    }
}
