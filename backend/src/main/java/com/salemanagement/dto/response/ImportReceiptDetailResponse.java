package com.salemanagement.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ImportReceiptDetailResponse {
    private Long id;
    private String createdByName;
    private String supplierName;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private String note;
    private List<Item> details;

    @Data
    @Builder
    public static class Item {
        private String variantCode;
        private String variantName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subTotal;
    }
}
