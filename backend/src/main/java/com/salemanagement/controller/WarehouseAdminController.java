package com.salemanagement.controller;

import com.salemanagement.dto.response.ImportReceiptDetailResponse;
import com.salemanagement.dto.response.ImportReceiptSummaryResponse;
import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.dto.response.StaffResponse;
import com.salemanagement.dto.response.WarehouseResponse;
import com.salemanagement.service.WarehouseAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WarehouseAdminController {

    private final WarehouseAdminService warehouseAdminService;

    @GetMapping("/warehouses/{id}")
    public ResponseEntity<WarehouseResponse> getWarehouseConfig(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseAdminService.getWarehouseConfig(id));
    }

    @GetMapping("/warehouses/staff")
    public ResponseEntity<PageResponse<StaffResponse>> getWarehouseStaffs(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(warehouseAdminService.getWarehouseStaffs(name, email, page, size));
    }

    @GetMapping("/imports")
    public ResponseEntity<PageResponse<ImportReceiptSummaryResponse>> getImportHistory(
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(warehouseAdminService.getImportHistory(createdBy, status, page, size));
    }

    @GetMapping("/imports/{id}")
    public ResponseEntity<ImportReceiptDetailResponse> getImportDetail(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseAdminService.getImportDetail(id));
    }

    @PutMapping("/imports/{id}/status")
    public ResponseEntity<Void> updateImportStatus(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.salemanagement.dto.request.UpdateImportStatusRequest request) {
        warehouseAdminService.updateImportStatus(id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/warehouses/{id}")
    public ResponseEntity<WarehouseResponse> updateWarehouse(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.salemanagement.dto.request.UpdateWarehouseInfoRequest request) {
        return ResponseEntity.ok(warehouseAdminService.updateWarehouse(id, request));
    }
}
