package com.salemanagement.dto.response;

import com.salemanagement.entity.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(String code, String customerName, String customerPhone,
        String email, String shippingAddress, String note, String paymentMethod,
        BigDecimal totalAmount, BigDecimal discountAmount, BigDecimal paymentAmount,
        String status, LocalDateTime createdAt, List<OrderDetailResponse> details) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getCode(), order.getCustomerName(), order.getCustomerPhone(),
                order.getEmail(), order.getShippingAddress(), order.getNote(), order.getPaymentMethod(),
                order.getTotalAmount(), order.getDiscountAmount(), order.getPaymentAmount(),
                order.getStatus(), order.getCreatedAt(),
                order.getDetails().stream().map(OrderDetailResponse::from).toList());
    }

    public static OrderResponse summary(Order order) {
        return new OrderResponse(
                order.getCode(), order.getCustomerName(), order.getCustomerPhone(),
                order.getEmail(), order.getShippingAddress(), order.getNote(), order.getPaymentMethod(),
                order.getTotalAmount(), order.getDiscountAmount(), order.getPaymentAmount(),
                order.getStatus(), order.getCreatedAt(), List.of());
    }
}
