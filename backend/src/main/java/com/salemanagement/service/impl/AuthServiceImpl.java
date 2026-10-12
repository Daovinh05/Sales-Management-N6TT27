package com.salemanagement.service.impl;

import com.salemanagement.dto.request.LoginRequest;
import com.salemanagement.dto.request.RefreshRequest;
import com.salemanagement.dto.request.RegisterRequest;
import com.salemanagement.dto.response.JwtResponse;
import com.salemanagement.entity.PasswordResetToken;
import com.salemanagement.entity.RefreshToken;
import com.salemanagement.entity.Role;
import com.salemanagement.enums.ERole;
import com.salemanagement.entity.User;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.security.CustomUserDetails;
import com.salemanagement.security.JwtProvider;
import com.salemanagement.service.AuthService;
import com.salemanagement.service.MailService;
import com.salemanagement.service.PasswordResetService;
import com.salemanagement.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetService passwordResetService;
    private final MailService mailService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();
        String refreshToken = refreshTokenService.create(user).getToken();
        List<String> roles = user.getRoles().stream().map(r -> r.getName().name()).toList();
        return new JwtResponse(token, refreshToken, user.getId(), user.getUsername(), user.getEmail(), roles);
    }

    @Override
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username đã tồn tại");
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        Role customerRole = roleRepository.findByName(ERole.ROLE_CUSTOMER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(ERole.ROLE_CUSTOMER)
                        .description("Khách hàng mua hàng")
                        .build()));
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .status("ACTIVE")
                .roles(Set.of(customerRole))
                .build();
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public JwtResponse refresh(RefreshRequest request) {
        RefreshToken oldToken = refreshTokenService.verify(request.getRefreshToken());
        User user = oldToken.getUser();
        // Xoay vòng: thu hồi token cũ, cấp cặp mới
        refreshTokenService.revoke(oldToken.getToken());
        String newAccessToken = jwtProvider.generateTokenFromUsername(user.getUsername());
        String newRefreshToken = refreshTokenService.create(user).getToken();
        List<String> roles = user.getRoles().stream().map(r -> r.getName().name()).toList();
        return new JwtResponse(newAccessToken, newRefreshToken, user.getId(),
                user.getUsername(), user.getEmail(), roles);
    }

    @Override
    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    @Override
    @Transactional
    public ForgotPasswordResult forgotPassword(String usernameOrEmail) {
        String key = usernameOrEmail == null ? "" : usernameOrEmail.trim();
        var userOpt = userRepository.findByUsername(key);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(key);
        }
        if (userOpt.isEmpty()) {
            // Chống dò tài khoản: không báo lỗi, không tạo token
            return new ForgotPasswordResult(null, false);
        }
        User user = userOpt.get();
        PasswordResetToken resetToken = passwordResetService.create(user);
        String token = resetToken.getToken();
        log.info("Đã tạo mã đặt lại mật khẩu cho '{}'", key);

        // Gửi mail thật qua Gmail cố định nếu đã cấu hình SMTP và user có email.
        // Gửi lỗi thì chỉ warn (không fail request) để vẫn test được bằng mã demo.
        boolean mailSent = false;
        if (user.getEmail() != null && !user.getEmail().isBlank() && mailService.isConfigured()) {
            try {
                mailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), token);
                mailSent = true;
            } catch (Exception e) {
                log.warn("Gửi mail đặt lại mật khẩu thất bại cho '{}': {}", key, e.getMessage());
            }
        }
        return new ForgotPasswordResult(token, mailSent);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetService.verify(token);
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetService.markUsed(resetToken);
    }
}
