package com.salemanagement.service;

import com.salemanagement.dto.request.OrderRequest;
import com.salemanagement.dto.response.OrderResponse;
import java.util.List;

public interface OrderService {

    List<OrderResponse> list(String code, String customerName);

    OrderResponse detail(String code);

    OrderResponse create(OrderRequest request);

    OrderResponse updateStatus(String code, String status);

    void delete(String code);
}
