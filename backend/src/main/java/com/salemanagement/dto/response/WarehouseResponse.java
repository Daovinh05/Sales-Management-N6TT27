package com.salemanagement.dto.response;

import com.salemanagement.entity.Warehouse;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponse {

    private Long id;
    private String name;
    private String address;
    private String phone;
    private String status;
    private LocalDateTime createdAt;

    public static WarehouseResponse from(Warehouse warehouse) {
        if (warehouse == null) {
            return null;
        }
        return WarehouseResponse.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .address(warehouse.getAddress())
                .phone(warehouse.getPhone())
                .status(warehouse.getStatus())
                .createdAt(warehouse.getCreatedAt())
                .build();
    }
}
