package com.salemanagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateManagedUserRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @Email @Size(max = 100) String email,
        @NotBlank String role,
        boolean removeAvatar) {
}