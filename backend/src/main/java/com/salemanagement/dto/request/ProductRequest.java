package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductRequest {
    @NotBlank(message = "Mã sản phẩm không được để trống")
    @Size(max = 20, message = "Mã sản phẩm tối đa 20 ký tự")
    private String code;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String name;

    @Size(max = 20, message = "Mã danh mục tối đa 20 ký tự")
    private String categoryCode;

    @Size(max = 20, message = "Mã thương hiệu tối đa 20 ký tự")
    private String brandCode;

    @Size(max = 20, message = "Mã nhà cung cấp tối đa 20 ký tự")
    private String supplierCode;
}
