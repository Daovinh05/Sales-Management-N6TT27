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
    public ResponseEntity<List<StaffResponse>> getWarehouseStaffs() {
        return ResponseEntity.ok(warehouseAdminService.getWarehouseStaffs());
    }

    @GetMapping("/imports")
    public ResponseEntity<PageResponse<ImportReceiptSummaryResponse>> getImportHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(warehouseAdminService.getImportHistory(page, size));
    }

    @GetMapping("/imports/{id}")
    public ResponseEntity<ImportReceiptDetailResponse> getImportDetail(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseAdminService.getImportDetail(id));
    }
}
