package com.salemanagement.repository;

import com.salemanagement.entity.PasswordResetToken;
import com.salemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    @Query("update PasswordResetToken t set t.used = true, t.usedAt = CURRENT_TIMESTAMP " +
            "where t.user = :user and t.used = false")
    void revokeAllByUser(User user);
}
