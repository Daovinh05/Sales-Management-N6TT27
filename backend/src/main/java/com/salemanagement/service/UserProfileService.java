package com.salemanagement.service;

import com.salemanagement.dto.request.UpdateProfileRequest;
import com.salemanagement.dto.response.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService {
    UserProfileResponse getProfile(String username);

    UserProfileResponse updateProfile(String username, UpdateProfileRequest request, MultipartFile avatar);
}