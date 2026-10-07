package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CartAddRequest {
    @NotBlank(message = "Vui lòng cung cấp mã biến thể")
    @Size(max = 20, message = "Mã biến thể tối đa 20 ký tự")
    private String variantCode;

    // Không gửi quantity thì mặc định 1 như PHP.
    @Positive(message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
}
