package com.salemanagement.service;

import com.salemanagement.dto.request.CartAddRequest;
import com.salemanagement.dto.request.CartUpdateRequest;
import com.salemanagement.dto.response.CartResponse;
import com.salemanagement.entity.User;

public interface CartService {
    CartResponse getCart(User user);

    CartResponse addItem(User user, CartAddRequest request);

    CartResponse updateQuantity(User user, String variantCode, CartUpdateRequest request);

    CartResponse removeItem(User user, String variantCode);

    void clear(User user);
}
