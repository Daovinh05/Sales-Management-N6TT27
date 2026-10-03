package com.salemanagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(
        @NotBlank @Size(max = 150) String customerName,
        @Size(max = 30) String customerPhone,
        @Size(max = 100) String email,
        @Size(max = 255) String shippingAddress,
        String note,
        BigDecimal discountAmount,
        @NotEmpty @Valid List<OrderItemRequest> items) {

    public record OrderItemRequest(
            @Size(max = 20) String variantCode,
            @Size(max = 255) String productName,
            @Positive int quantity,
            BigDecimal unitPrice) {
    }
}
