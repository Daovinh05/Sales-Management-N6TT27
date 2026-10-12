package com.salemanagement.controller;

import com.salemanagement.dto.request.ForgotPasswordRequest;
import com.salemanagement.dto.request.LoginRequest;
import com.salemanagement.dto.request.RefreshRequest;
import com.salemanagement.dto.request.RegisterRequest;
import com.salemanagement.dto.request.ResetPasswordRequest;
import com.salemanagement.dto.response.JwtResponse;
import com.salemanagement.entity.User;
import com.salemanagement.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "message", "Đăng ký thành công"
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }

    @PostMapping({"/forgot-password", "/password/forgot"})
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        AuthService.ForgotPasswordResult result = authService.forgotPassword(request.getUsername());
        // Luôn trả 200 giống nhau để chống dò tài khoản.
        // Gửi mail thành công thì ẨN mã khỏi response; chỉ trả mã demo khi chưa gửi được mail.
        if (result.resetToken() != null && !result.mailSent()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Nếu tài khoản tồn tại, mã đã được gửi",
                    "resetToken", result.resetToken()));
        }
        return ResponseEntity.ok(Map.of("message", "Nếu tài khoản tồn tại, mã đã được gửi"));
    }

    // Alias nhận {email} theo contracts/password-reset-api.yaml
    @PostMapping("/password/forgot-email")
    public ResponseEntity<?> forgotPasswordByEmail(@Valid @RequestBody Map<String, String> body) {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setUsername(body.getOrDefault("email", ""));
        return forgotPassword(request);
    }

    @PostMapping({"/reset-password", "/password/reset"})
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công, mời đăng nhập lại"));
    }
}
