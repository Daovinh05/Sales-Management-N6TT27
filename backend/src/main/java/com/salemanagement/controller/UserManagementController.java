package com.salemanagement.controller;

import com.salemanagement.entity.Role;
import com.salemanagement.entity.User;
import com.salemanagement.dto.request.UpdateManagedUserRequest;
import com.salemanagement.repository.RefreshTokenRepository;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.service.UserManagementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
        private final RefreshTokenRepository refreshTokenRepository;
        private final PasswordEncoder passwordEncoder;
        private final UserManagementService userManagementService;

    @GetMapping
    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserResponse(
                        user.getId(), user.getUsername(), user.getFullName(), user.getEmail(),
                        user.getPhone(), user.getStatus(), user.getRoles().stream().map(Role::getName).toList(),
                        user.getCreatedAt(), user.getAvatarUrl()))
                .toList();
    }

        @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @Transactional
        public UserResponse updateUser(
                        @PathVariable Long id,
                        @Valid @org.springframework.web.bind.annotation.RequestPart("data") UpdateManagedUserRequest request,
                        @org.springframework.web.bind.annotation.RequestPart(value = "avatar", required = false) MultipartFile avatar,
                        Authentication authentication) {
                return toResponse(userManagementService.updateUser(id, request, avatar, authentication.getName()));
        }

        @PostMapping
        @Transactional
        public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
                String username = request.username().trim();
                String email = request.email() == null || request.email().isBlank() ? null : request.email().trim();
                if (userRepository.existsByUsername(username)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên tài khoản đã tồn tại");
                }
                if (email != null && userRepository.existsByEmail(email)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
                }

                String roleName = request.role() == null || request.role().isBlank() ? "ROLE_CUSTOMER" : request.role();
                if (!"ROLE_ADMIN".equals(roleName) && !"ROLE_CUSTOMER".equals(roleName)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ");
                }
                Role role = roleRepository.findByName(roleName)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò"));
                User user = User.builder()
                                .username(username)
                                .password(passwordEncoder.encode(request.password()))
                                .fullName(request.fullName())
                                .email(email)
                                .phone(request.phone())
                                .status("ACTIVE")
                                .roles(Set.of(role))
                                .build();
                return toResponse(userRepository.save(user));
        }

    @PutMapping("/{id}/role")
    @Transactional
    public UserResponse updateRole(
            @PathVariable Long id,
            @RequestBody RoleUpdateRequest request,
            Authentication authentication) {
        if (request == null || (!"ROLE_ADMIN".equals(request.role()) && !"ROLE_CUSTOMER".equals(request.role()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
        if (user.getUsername().equals(authentication.getName()) && !"ROLE_ADMIN".equals(request.role())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tự hạ quyền quản trị viên");
        }

        Role role = roleRepository.findByName(request.role())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy vai trò"));
        user.getRoles().clear();
        user.getRoles().add(role);
        User saved = userRepository.save(user);
                return toResponse(saved);
        }

        @DeleteMapping("/{id}")
        @Transactional
        public void deleteUser(@PathVariable Long id, Authentication authentication) {
                User user = userRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
                if (user.getUsername().equals(authentication.getName())) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể tự xóa tài khoản đang đăng nhập");
                }
                boolean isAdmin = user.getRoles().stream().anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));
                if (isAdmin && userRepository.countByRoleName("ROLE_ADMIN") <= 1) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể xóa quản trị viên cuối cùng");
                }
                refreshTokenRepository.deleteAllByUser(user);
                userRepository.delete(user);
        }

        private UserResponse toResponse(User user) {
                return new UserResponse(
                                user.getId(), user.getUsername(), user.getFullName(), user.getEmail(),
                                user.getPhone(), user.getStatus(), user.getRoles().stream().map(Role::getName).toList(),
                                user.getCreatedAt(), user.getAvatarUrl());
    }

        public record CreateUserRequest(
                        @NotBlank @Size(min = 3, max = 50) String username,
                        @NotBlank @Size(min = 6) String password,
                        @Email String email,
                        String fullName,
                        String phone,
                        String role) {}

    public record RoleUpdateRequest(String role) {}

    public record UserResponse(
            Long id,
            String username,
            String fullName,
            String email,
            String phone,
            String status,
            List<String> roles,
            LocalDateTime createdAt,
            String avatarUrl) {}
}