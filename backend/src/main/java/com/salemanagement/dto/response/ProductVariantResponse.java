package com.salemanagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class ProductVariantResponse {
    private String code;
    private String productCode;
    private String productName;
    private String name;
    private String imageUrl;
    private String color;
    private String ram;
    private String storage;
    private BigDecimal price;
    private Integer stockQuantity;
    private Integer reservedQuantity;
    private LocalDateTime createdAt;
}
