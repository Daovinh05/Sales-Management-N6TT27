package com.salemanagement.service.impl;

import com.salemanagement.dto.request.LoginRequest;
import com.salemanagement.dto.request.RefreshRequest;
import com.salemanagement.dto.request.RegisterRequest;
import com.salemanagement.dto.response.JwtResponse;
import com.salemanagement.entity.RefreshToken;
import com.salemanagement.entity.Role;
import com.salemanagement.enums.ERole;
import com.salemanagement.entity.User;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.security.CustomUserDetails;
import com.salemanagement.security.JwtProvider;
import com.salemanagement.service.AuthService;
import com.salemanagement.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
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
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
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
}
