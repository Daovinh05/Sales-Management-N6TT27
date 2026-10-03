package com.salemanagement.service;

import com.salemanagement.dto.request.UpdateManagedUserRequest;
import com.salemanagement.entity.User;
import org.springframework.web.multipart.MultipartFile;

public interface UserManagementService {

    User updateUser(Long id, UpdateManagedUserRequest request, MultipartFile avatar, String currentUsername);
}