package com.salemanagement.dto.response;

import com.salemanagement.entity.Supplier;
import java.time.LocalDateTime;

public record SupplierResponse(String code, String name, String address, String phone, LocalDateTime createdAt) {

    public static SupplierResponse from(Supplier supplier) {
        return new SupplierResponse(
                supplier.getCode(), supplier.getName(), supplier.getAddress(), supplier.getPhone(), supplier.getCreatedAt());
    }
}