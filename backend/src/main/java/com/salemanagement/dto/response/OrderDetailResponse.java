package com.salemanagement.dto.response;

import com.salemanagement.entity.OrderDetail;
import java.math.BigDecimal;

public record OrderDetailResponse(Long id, String variantCode, String productName, Integer quantity,
        BigDecimal unitPrice, BigDecimal lineTotal) {

    public static OrderDetailResponse from(OrderDetail detail) {
        BigDecimal lineTotal = detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity()));
        return new OrderDetailResponse(
                detail.getId(), detail.getVariantCode(), detail.getProductName(),
                detail.getQuantity(), detail.getUnitPrice(), lineTotal);
    }
}
