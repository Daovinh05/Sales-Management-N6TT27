package com.salemanagement.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InventoryResponse {
    private String variantCode;
    private String name;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private String status;
}
