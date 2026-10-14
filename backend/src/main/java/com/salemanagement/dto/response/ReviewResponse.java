package com.salemanagement.dto.response;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        String code,
        String customerName,
        String productName,
        Integer rating,
        String content,
        String reply,
        LocalDateTime createdAt) {
}
