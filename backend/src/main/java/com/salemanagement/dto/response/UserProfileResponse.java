package com.salemanagement.dto.response;

import com.salemanagement.entity.User;

import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String username,
        String fullName,
        String email,
        String phone,
        String address,
        LocalDateTime createdAt) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getCreatedAt());
    }
}