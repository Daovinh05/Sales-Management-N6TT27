package com.salemanagement.controller;

import com.salemanagement.dto.request.WarehouseRequest;
import com.salemanagement.dto.response.ApiResponse;
import com.salemanagement.dto.response.InventoryResponse;
import com.salemanagement.dto.response.WarehouseResponse;
import com.salemanagement.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/warehouses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public ResponseEntity<ApiResponse<WarehouseResponse>> getCentralWarehouse() {
        WarehouseResponse response = warehouseService.getWarehouse();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<WarehouseResponse>> updateCentralWarehouse(
            @Valid @RequestBody WarehouseRequest request) {
        WarehouseResponse response = warehouseService.updateWarehouse(request);
        return ResponseEntity.ok(ApiResponse.message("Cập nhật thông tin kho thành công", response));
    }
    
    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getCentralWarehouseInventory() {
        List<InventoryResponse> responses = warehouseService.getWarehouseInventory();
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }
}
