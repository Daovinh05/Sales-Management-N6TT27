package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank @Size(max = 20) String code,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 255) String address,
        @Size(max = 30) String phone) {
}