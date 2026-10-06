package com.salemanagement.service;

import com.salemanagement.dto.response.ImportReceiptDetailResponse;
import com.salemanagement.dto.response.ImportReceiptSummaryResponse;
import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.dto.response.StaffResponse;
import com.salemanagement.dto.response.WarehouseResponse;

import java.util.List;

public interface WarehouseAdminService {
    WarehouseResponse getWarehouseConfig(Long id);
    List<StaffResponse> getWarehouseStaffs();
    PageResponse<ImportReceiptSummaryResponse> getImportHistory(int page, int size);
    ImportReceiptDetailResponse getImportDetail(Long id);
    void updateImportStatus(Long id, com.salemanagement.dto.request.UpdateImportStatusRequest request);
    WarehouseResponse updateWarehouse(Long id, com.salemanagement.dto.request.UpdateWarehouseInfoRequest request);
}
