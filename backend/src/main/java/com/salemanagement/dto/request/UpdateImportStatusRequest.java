package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateImportStatusRequest {
    @NotBlank(message = "Trạng thái không được để trống")
    private String status;
}
