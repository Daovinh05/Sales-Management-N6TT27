package com.salemanagement.dto.response;

import com.salemanagement.entity.Promotion;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionResponse(
        String code,
        String name,
        BigDecimal discountAmount,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        String status,
        LocalDateTime createdAt) {

    public static PromotionResponse from(Promotion promotion, String status) {
        return new PromotionResponse(
                promotion.getCode(),
                promotion.getName(),
                promotion.getDiscountAmount(),
                promotion.getStartsAt(),
                promotion.getEndsAt(),
                status,
                promotion.getCreatedAt());
    }
}