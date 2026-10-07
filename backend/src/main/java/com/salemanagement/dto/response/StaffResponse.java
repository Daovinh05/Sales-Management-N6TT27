package com.salemanagement.dto.response;

import lombok.Builder;
import lombok.Data;
import com.salemanagement.entity.User;

@Data
@Builder
public class StaffResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    
    public static StaffResponse from(User user) {
        return StaffResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }
}
