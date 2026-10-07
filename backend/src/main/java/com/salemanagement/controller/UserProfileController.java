package com.salemanagement.controller;

import com.salemanagement.dto.request.UpdateProfileRequest;
import com.salemanagement.dto.response.UserProfileResponse;
import com.salemanagement.security.CustomUserDetails;
import com.salemanagement.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public UserProfileResponse getProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return userProfileService.getProfile(principal.getUsername());
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestPart("data") UpdateProfileRequest request,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
        return userProfileService.updateProfile(principal.getUsername(), request, avatar);
    }
}