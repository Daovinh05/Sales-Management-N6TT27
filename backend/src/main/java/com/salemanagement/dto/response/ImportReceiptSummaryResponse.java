package com.salemanagement.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ImportReceiptSummaryResponse {
    private Long id;
    private String createdByName;
    private String supplierName;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private String note;
}
