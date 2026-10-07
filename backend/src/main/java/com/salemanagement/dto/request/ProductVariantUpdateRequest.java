package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductVariantUpdateRequest {
    @NotBlank(message = "Mã sản phẩm không được để trống")
    @Size(max = 20, message = "Mã sản phẩm tối đa 20 ký tự")
    private String productCode;

    @Size(max = 100, message = "Tên biến thể tối đa 100 ký tự")
    private String name;

    @Size(max = 255, message = "Màu sắc tối đa 255 ký tự")
    private String color;

    @Size(max = 50, message = "RAM tối đa 50 ký tự")
    private String ram;

    @Size(max = 50, message = "Dung lượng tối đa 50 ký tự")
    private String storage;

    @PositiveOrZero(message = "Giá phải >= 0")
    private BigDecimal price;
}
