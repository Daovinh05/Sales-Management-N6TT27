package com.salemanagement.dto.response;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class StorefrontProductResponse {
    private String code;
    private String name;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer stockQuantity;
    private String brandName;
    private String categoryName;
}
