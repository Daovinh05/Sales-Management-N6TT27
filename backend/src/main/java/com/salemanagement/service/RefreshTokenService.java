package com.salemanagement.service;

import com.salemanagement.entity.RefreshToken;
import com.salemanagement.entity.User;

public interface RefreshTokenService {
    RefreshToken create(User user);
    RefreshToken verify(String token);
    void revoke(String token);
    void revokeAllByUser(User user);
}
