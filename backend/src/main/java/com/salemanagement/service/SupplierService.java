package com.salemanagement.service;

import com.salemanagement.dto.request.SupplierRequest;
import com.salemanagement.dto.request.SupplierUpdateRequest;
import com.salemanagement.dto.response.SupplierResponse;
import java.util.List;

public interface SupplierService {

    List<SupplierResponse> list();

    SupplierResponse create(SupplierRequest request);

    SupplierResponse update(String code, SupplierUpdateRequest request);

    void delete(String code);
}