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

    @Positive(message = "Số lượng phải lớn hơn 0")
    private int quantity = 1;
}
