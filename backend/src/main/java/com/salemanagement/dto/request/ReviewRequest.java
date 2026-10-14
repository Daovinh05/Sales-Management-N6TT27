package com.salemanagement.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        @NotBlank @Size(max = 100) String customerName,
        @NotBlank @Size(max = 150) String productName,
        @Min(1) @Max(5) Integer rating,
        @NotBlank @Size(max = 2000) String content,
        @Size(max = 2000) String reply) {
}
