package com.salemanagement.service;

import com.salemanagement.entity.PasswordResetToken;
import com.salemanagement.entity.User;

public interface PasswordResetService {
    PasswordResetToken create(User user);
    PasswordResetToken verify(String token);
    void revokeAllByUser(User user);
    void markUsed(PasswordResetToken token);
}
