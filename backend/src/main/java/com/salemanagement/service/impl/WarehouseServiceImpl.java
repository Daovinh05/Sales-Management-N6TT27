package com.salemanagement.service.impl;

import com.salemanagement.dto.request.WarehouseRequest;
import com.salemanagement.dto.response.WarehouseResponse;
import com.salemanagement.entity.Warehouse;
import com.salemanagement.exception.ResourceNotFoundException;
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

    @Override
    @Transactional
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        if (warehouseRepository.existsByName(request.getName().trim())) {
            throw new IllegalArgumentException("Tên kho '" + request.getName().trim() + "' đã tồn tại");
        }

        Warehouse warehouse = Warehouse.builder()
                .name(request.getName().trim())
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .status(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().trim() : "ACTIVE")
                .build();

        Warehouse saved = warehouseRepository.save(warehouse);
        return WarehouseResponse.from(saved);
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(Long id, WarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho với ID: " + id));

        String trimmedName = request.getName().trim();
        if (warehouseRepository.existsByNameAndIdNot(trimmedName, id)) {
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
    @Transactional
    public void deleteWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho với ID: " + id));
        warehouseRepository.delete(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouseById(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho với ID: " + id));
        return WarehouseResponse.from(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(WarehouseResponse::from)
                .toList();
    }
}
