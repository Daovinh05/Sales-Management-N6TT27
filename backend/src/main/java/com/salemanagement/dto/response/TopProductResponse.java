package com.salemanagement.dto.response;

import java.math.BigDecimal;

public record TopProductResponse(String variantCode, String productName, long quantity, BigDecimal revenue) {
}
