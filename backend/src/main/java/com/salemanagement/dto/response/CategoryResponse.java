package com.salemanagement.dto.response;

import com.salemanagement.entity.Category;
import java.time.LocalDateTime;

public record CategoryResponse(String code, String name, LocalDateTime createdAt) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getCode(), category.getName(), category.getCreatedAt());
    }
}