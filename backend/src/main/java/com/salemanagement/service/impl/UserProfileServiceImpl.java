package com.salemanagement.service.impl;

import com.salemanagement.dto.request.UpdateProfileRequest;
import com.salemanagement.dto.response.UserProfileResponse;
import com.salemanagement.entity.User;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String username) {
        return UserProfileResponse.from(findUser(username));
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = findUser(username);
        String email = normalize(request.getEmail());

        if (email != null) {
            userRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new BusinessException("Email đã được sử dụng", HttpStatus.CONFLICT);
                    });
        }

        user.setFullName(normalize(request.getFullName()));
        user.setEmail(email);
        user.setPhone(normalize(request.getPhone()));
        user.setAddress(normalize(request.getAddress()));
        return UserProfileResponse.from(userRepository.save(user));
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}