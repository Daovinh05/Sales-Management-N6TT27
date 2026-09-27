package com.salemanagement.controller;

import com.salemanagement.dto.request.UpdateProfileRequest;
import com.salemanagement.dto.response.UserProfileResponse;
import com.salemanagement.entity.User;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;

    @GetMapping
    public UserProfileResponse getProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return UserProfileResponse.from(principal.getUser());
    }

    @PutMapping
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = principal.getUser();
        String email = normalize(request.getEmail());

        if (email != null) {
            userRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
                    });
        }

        user.setFullName(normalize(request.getFullName()));
        user.setEmail(email);
        user.setPhone(normalize(request.getPhone()));
        user.setAddress(normalize(request.getAddress()));
        return UserProfileResponse.from(userRepository.save(user));
    }

    private String normalize(String value) {
        if (value == null || value.isBlank())
            return null;
        return value.trim();
    }
}