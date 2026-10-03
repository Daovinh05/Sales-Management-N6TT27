package com.salemanagement.service.impl;

import com.salemanagement.dto.request.OrderRequest;
import com.salemanagement.dto.response.OrderResponse;
import com.salemanagement.entity.Order;
import com.salemanagement.entity.OrderDetail;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.service.OrderService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final Set<String> STATUSES = Set.of(
            Order.STATUS_PENDING, Order.STATUS_CONFIRMED, Order.STATUS_SHIPPING,
            Order.STATUS_COMPLETED, Order.STATUS_CANCELLED);

    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> list(String code, String customerName) {
        return orderRepository
                .findByCodeContainingIgnoreCaseAndCustomerNameContainingIgnoreCaseOrderByCreatedAtDesc(
                        code == null ? "" : code.trim(), customerName == null ? "" : customerName.trim())
                .stream()
                .map(OrderResponse::summary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse detail(String code) {
        return OrderResponse.from(findOrder(code));
    }

    @Override
    @Transactional
    public OrderResponse create(OrderRequest request) {
        Order order = new Order();
        order.setCode(nextCode());
        order.setCustomerName(request.customerName().trim());
        order.setCustomerPhone(normalize(request.customerPhone()));
        order.setEmail(normalize(request.email()));
        order.setShippingAddress(normalize(request.shippingAddress()));
        order.setNote(normalize(request.note()));
        order.setDiscountAmount(nonNegative(request.discountAmount()));
        order.setStatus(Order.STATUS_PENDING);

        BigDecimal total = BigDecimal.ZERO;
        for (OrderRequest.OrderItemRequest item : request.items()) {
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setVariantCode(normalize(item.variantCode()));
            detail.setProductName(item.productName() == null ? "" : item.productName().trim());
            detail.setQuantity(item.quantity());
            detail.setUnitPrice(item.unitPrice() == null ? BigDecimal.ZERO : item.unitPrice());
            order.getDetails().add(detail);
            total = total.add(detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity())));
        }
        order.setTotalAmount(total);
        order.setPaymentAmount(total.subtract(order.getDiscountAmount()).max(BigDecimal.ZERO));
        return OrderResponse.from(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(String code, String status) {
        if (!STATUSES.contains(status)) {
            throw new BusinessException("Trạng thái đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        Order order = findOrder(code);
        order.setStatus(status);
        return OrderResponse.from(orderRepository.save(order));
    }

    @Override
    @Transactional
    public void delete(String code) {
        findOrder(code);
        orderRepository.deleteById(code.trim().toUpperCase());
    }

    private Order findOrder(String code) {
        return orderRepository.findById(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
    }

    private String nextCode() {
        long count = orderRepository.count() + 1;
        String code = "DH" + count;
        while (orderRepository.existsById(code)) {
            count += 1;
            code = "DH" + count;
        }
        return code;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private BigDecimal nonNegative(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }
}
