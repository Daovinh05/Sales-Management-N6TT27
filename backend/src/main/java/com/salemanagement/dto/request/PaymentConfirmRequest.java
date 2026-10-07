package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PaymentConfirmRequest(
        @NotBlank @Pattern(regexp = "COD|VIETQR",
                message = "Phương thức thanh toán không hợp lệ") String paymentMethod) {
}
