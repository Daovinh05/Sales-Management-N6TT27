package com.salemanagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionRequest(
        @NotBlank @Size(max = 20) String code,
        @NotBlank @Size(max = 100) String name,
        @NotNull @DecimalMin("0.0") BigDecimal discountAmount,
        @NotNull LocalDateTime startsAt,
        @NotNull LocalDateTime endsAt) {
}