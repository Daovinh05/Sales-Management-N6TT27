package com.salemanagement.service;

import com.salemanagement.dto.request.ProductRequest;
import com.salemanagement.dto.request.ProductUpdateRequest;
import com.salemanagement.dto.response.ImportResult;
import com.salemanagement.dto.response.ProductResponse;
import com.salemanagement.util.ExcelHelper.ParsedProductRow;
import java.util.List;

public interface ProductService {
    List<ProductResponse> list(String code, String name);

    ProductResponse getDetail(String code);

    ProductResponse create(ProductRequest request);

    ProductResponse update(String code, ProductUpdateRequest request);

    void delete(String code);

    ImportResult importRows(List<ParsedProductRow> rows);
}
