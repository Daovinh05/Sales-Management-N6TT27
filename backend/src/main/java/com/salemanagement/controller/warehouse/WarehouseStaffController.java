package com.salemanagement.controller.warehouse;

import com.salemanagement.dto.request.ImportReceiptRequest;
import com.salemanagement.dto.response.ImportReceiptDetailResponse;
import com.salemanagement.dto.response.ImportReceiptSummaryResponse;
import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.service.warehouse.WarehouseStaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WAREHOUSE_STAFF')")
public class WarehouseStaffController {

    private final WarehouseStaffService warehouseStaffService;

    @GetMapping("/imports")
    public ResponseEntity<PageResponse<ImportReceiptSummaryResponse>> getMyImports(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(warehouseStaffService.getMyImports(authentication.getName(), page, size));
    }

    @PostMapping("/imports")
    public ResponseEntity<ImportReceiptDetailResponse> createImport(
            Authentication authentication,
            @Valid @RequestBody ImportReceiptRequest request) {
        return ResponseEntity.ok(warehouseStaffService.createImport(request, authentication.getName()));
    }

    @GetMapping("/imports/{id}")
    public ResponseEntity<ImportReceiptDetailResponse> getMyImportDetail(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(warehouseStaffService.getMyImportDetail(id, authentication.getName()));
    }
}
