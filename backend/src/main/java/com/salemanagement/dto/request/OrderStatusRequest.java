package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OrderStatusRequest(
        @NotBlank @Pattern(regexp = "CHO_DUYET|DA_XAC_NHAN|DANG_GIAO|HOAN_THANH|DA_HUY",
                message = "Trạng thái đơn hàng không hợp lệ") String status) {
}
