package com.salemanagement.dto.response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class CartItemResponse {
    private String variantCode;
    private String productCode;
    private String productName;
    private String variantName;
    private String imageUrl;
    private String color;
    private String ram;
    private String storage;
    private BigDecimal price;
    private Integer stockQuantity;
    private Integer quantity;
    private BigDecimal lineTotal;
}
