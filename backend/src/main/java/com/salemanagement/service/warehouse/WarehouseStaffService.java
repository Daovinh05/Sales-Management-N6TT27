package com.salemanagement.service.warehouse;

import com.salemanagement.dto.request.ImportReceiptRequest;
import com.salemanagement.dto.response.ImportReceiptDetailResponse;
import com.salemanagement.dto.response.ImportReceiptSummaryResponse;
import com.salemanagement.dto.response.PageResponse;

public interface WarehouseStaffService {
    ImportReceiptDetailResponse createImport(ImportReceiptRequest request, String username);
    PageResponse<ImportReceiptSummaryResponse> getMyImports(String username, int page, int size);
    ImportReceiptDetailResponse getMyImportDetail(Long id, String username);
}
