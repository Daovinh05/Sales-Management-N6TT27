package com.salemanagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class ProductResponse {
    private String code;
    private String name;
    private String categoryCode;
    private String categoryName;
    private String brandCode;
    private String brandName;
    private String supplierCode;
    private String supplierName;
    private String variantName;
    private String imageUrl;
    private BigDecimal price;
    private Integer stockQuantity;
    private LocalDateTime createdAt;
}
