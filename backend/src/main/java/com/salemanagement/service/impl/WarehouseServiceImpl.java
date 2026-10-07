package com.salemanagement.service.impl;

import com.salemanagement.dto.request.WarehouseRequest;
import com.salemanagement.dto.response.InventoryResponse;
import com.salemanagement.dto.response.WarehouseResponse;
import com.salemanagement.entity.Inventory;
import com.salemanagement.entity.Warehouse;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.WarehouseRepository;
import com.salemanagement.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;

    private static final Long CENTRAL_WAREHOUSE_ID = 1L;

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(WarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(CENTRAL_WAREHOUSE_ID)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho trung tâm"));

        String trimmedName = request.getName().trim();
        if (warehouseRepository.existsByNameAndIdNot(trimmedName, CENTRAL_WAREHOUSE_ID)) {
            throw new IllegalArgumentException("Tên kho '" + trimmedName + "' đã được sử dụng bởi kho khác");
        }

        warehouse.setName(trimmedName);
        warehouse.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        warehouse.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            warehouse.setStatus(request.getStatus().trim());
        }

        Warehouse updated = warehouseRepository.save(warehouse);
        return WarehouseResponse.from(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouse() {
        Warehouse warehouse = warehouseRepository.findById(CENTRAL_WAREHOUSE_ID)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho trung tâm"));
        return WarehouseResponse.from(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponse> getWarehouseInventory() {
        List<Inventory> inventories = inventoryRepository.findByWarehouseId(CENTRAL_WAREHOUSE_ID);
        return inventories.stream().map(inventory -> {
            int availableQuantity = inventory.getQuantity() - inventory.getReservedQuantity();
            String status = availableQuantity > 0 ? "Còn hàng" : "Hết hàng";
            
            return InventoryResponse.builder()
                    .variantCode(inventory.getProductVariant().getCode())
                    .name(inventory.getProductVariant().getProduct().getName() + " - " + inventory.getProductVariant().getColor() + " - " + inventory.getProductVariant().getRam() + " - " + inventory.getProductVariant().getStorage())
                    .quantity(inventory.getQuantity())
                    .reservedQuantity(inventory.getReservedQuantity())
                    .availableQuantity(availableQuantity)
                    .status(status)
                    .build();
        }).toList();
    }
}
