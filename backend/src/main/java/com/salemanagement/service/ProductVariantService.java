package com.salemanagement.service;

import com.salemanagement.dto.request.ProductVariantRequest;
import com.salemanagement.dto.request.ProductVariantUpdateRequest;
import com.salemanagement.dto.response.ImportResult;
import com.salemanagement.dto.response.ProductVariantResponse;
import com.salemanagement.util.ExcelHelper.ParsedVariantRow;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ProductVariantService {
    List<ProductVariantResponse> list(String code, String name);

    List<ProductVariantResponse> listByProduct(String productCode);

    ProductVariantResponse getDetail(String code);

    ProductVariantResponse create(ProductVariantRequest request, MultipartFile image);

    ProductVariantResponse update(String code, ProductVariantUpdateRequest request, MultipartFile image);

    void delete(String code);

    ImportResult importRows(List<ParsedVariantRow> rows);
}
