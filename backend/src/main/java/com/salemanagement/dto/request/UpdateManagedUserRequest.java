package com.salemanagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateManagedUserRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @Email @Size(max = 100) String email,
        @Size(max = 100) String fullName,
        @Pattern(regexp = "[0-9]*", message = "Số điện thoại chỉ được chứa chữ số")
        @Size(max = 20) String phone,
        @Size(max = 255) String address,
        @NotBlank String role,
        @NotBlank String status,
        String password,
        boolean removeAvatar) {
}