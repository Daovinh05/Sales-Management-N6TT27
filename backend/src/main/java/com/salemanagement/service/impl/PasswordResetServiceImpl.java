package com.salemanagement.service.impl;

import com.salemanagement.entity.PasswordResetToken;
import com.salemanagement.entity.User;
import com.salemanagement.repository.PasswordResetTokenRepository;
import com.salemanagement.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final long EXPIRATION_MINUTES = 15;

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Override
    @Transactional
    public PasswordResetToken create(User user) {
        // 1 user chỉ 1 token hiệu lực: thu hồi token cũ trước khi tạo mới
        passwordResetTokenRepository.revokeAllByUser(user);
        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString().replace("-", ""))
                .expiresAt(LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES))
                .used(false)
                .build();
        return passwordResetTokenRepository.save(token);
    }

    @Override
    @Transactional(readOnly = true)
    public PasswordResetToken verify(String token) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Mã đặt lại không hợp lệ"));
        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Mã đặt lại đã được sử dụng");
        }
        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Mã đặt lại đã hết hạn");
        }
        return resetToken;
    }

    @Override
    @Transactional
    public void revokeAllByUser(User user) {
        passwordResetTokenRepository.revokeAllByUser(user);
    }

    @Override
    @Transactional
    public void markUsed(PasswordResetToken token) {
        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(token);
    }
}
