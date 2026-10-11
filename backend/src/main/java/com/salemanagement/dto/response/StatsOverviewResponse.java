package com.salemanagement.dto.response;

import java.math.BigDecimal;

public record StatsOverviewResponse(BigDecimal revenue, long completedOrders, long totalOrders,
                                    long cancelledOrders) {
}
