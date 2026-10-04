package com.salemanagement.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CartUpdateRequest {
    @Positive(message = "Số lượng phải lớn hơn 0")
    private int quantity;
}
