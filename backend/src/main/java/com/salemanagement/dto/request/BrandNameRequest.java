package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandNameRequest(@NotBlank @Size(max = 100) String name) {
}