package com.salemanagement.dto.response;

import java.math.BigDecimal;

public record RevenuePointResponse(String date, BigDecimal revenue, long orders) {
}
