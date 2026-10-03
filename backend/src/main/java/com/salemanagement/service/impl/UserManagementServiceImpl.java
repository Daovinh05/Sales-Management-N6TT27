package com.salemanagement.service.impl;

import com.salemanagement.dto.request.UpdateManagedUserRequest;
import com.salemanagement.entity.Role;
import com.salemanagement.entity.User;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.service.FileStorageService;
import com.salemanagement.service.UserManagementService;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public User updateUser(Long id, UpdateManagedUserRequest request, MultipartFile avatar, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        String username = request.username().trim();
        String email = request.email() == null || request.email().isBlank() ? null : request.email().trim();
        String roleName = request.role();

        if (!"ROLE_ADMIN".equals(roleName) && !"ROLE_CUSTOMER".equals(roleName)) {
            throw new BusinessException("Vai trò không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw new BusinessException("Tên tài khoản đã tồn tại", HttpStatus.CONFLICT);
        }
        if (email != null && userRepository.existsByEmailAndIdNot(email, id)) {
            throw new BusinessException("Email đã được sử dụng", HttpStatus.CONFLICT);
        }

        boolean isAdmin = user.getRoles().stream().anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));
        boolean willBeAdmin = "ROLE_ADMIN".equals(roleName);
        if (user.getUsername().equals(currentUsername) && !willBeAdmin) {
            throw new BusinessException("Không thể tự hạ quyền quản trị viên", HttpStatus.BAD_REQUEST);
        }
        if (isAdmin && !willBeAdmin && userRepository.countByRoleName("ROLE_ADMIN") <= 1) {
            throw new BusinessException("Không thể hạ quyền quản trị viên cuối cùng", HttpStatus.BAD_REQUEST);
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò"));
        String previousAvatar = user.getAvatarUrl();
        String newAvatar = avatar == null || avatar.isEmpty() ? null : fileStorageService.storeUserAvatar(avatar);
        user.setUsername(username);
        user.setEmail(email);
        user.getRoles().clear();
        user.getRoles().add(role);
        if (newAvatar != null) {
            user.setAvatarUrl(newAvatar);
        } else if (request.removeAvatar()) {
            user.setAvatarUrl(null);
        }

        try {
            User saved = userRepository.saveAndFlush(user);
            if (newAvatar != null || request.removeAvatar()) {
                fileStorageService.deleteUserAvatar(previousAvatar);
            }
            return saved;
        } catch (RuntimeException exception) {
            fileStorageService.deleteUserAvatar(newAvatar);
            throw exception;
        }
    }
}