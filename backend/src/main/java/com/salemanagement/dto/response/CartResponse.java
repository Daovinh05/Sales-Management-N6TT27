package com.salemanagement.dto.response;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class CartResponse {
    private List<CartItemResponse> items;
    private int totalItems;
    private int totalQuantity;
    private BigDecimal subtotal;
}
