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
}
