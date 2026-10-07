package com.salemanagement.service;

import com.salemanagement.dto.request.OrderRequest;
import com.salemanagement.dto.response.OrderResponse;
import java.util.List;

public interface OrderService {

    List<OrderResponse> list(String code, String customerName);

    List<OrderResponse> myOrders(String username);

    OrderResponse detail(String code);

    OrderResponse ownerDetail(String code, String username);

    OrderResponse create(OrderRequest request, String username);

    OrderResponse updateStatus(String code, String status);

    void delete(String code);

    /** Khách xác nhận phương thức thanh toán cho đơn CHO_DUYET của mình. */
    OrderResponse confirmPayment(String code, String paymentMethod, String username);

    /** Khách hủy đơn CHO_DUYET của mình (nhả chỗ giữ kho). */
    OrderResponse cancelByOwner(String code, String username);
}
