package com.salemanagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ImportReceiptRequest {

    @NotBlank(message = "Mã nhà cung cấp không được để trống")
    private String supplierCode;

    private String note;

    @NotEmpty(message = "Danh sách sản phẩm nhập không được để trống")
    @Valid
    private List<ItemRequest> details;

    @Data
    public static class ItemRequest {
        @NotBlank(message = "Mã biến thể không được để trống")
        private String variantCode;

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        private Integer quantity;

        @NotNull(message = "Giá nhập không được để trống")
        @Min(value = 0, message = "Giá nhập không được âm")
        private BigDecimal importPrice;
    }
}
