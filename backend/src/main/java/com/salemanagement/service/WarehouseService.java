package com.salemanagement.service;

import com.salemanagement.dto.request.WarehouseRequest;
import com.salemanagement.dto.response.WarehouseResponse;

import java.util.List;

public interface WarehouseService {

    WarehouseResponse createWarehouse(WarehouseRequest request);

    WarehouseResponse updateWarehouse(Long id, WarehouseRequest request);

    void deleteWarehouse(Long id);

    WarehouseResponse getWarehouseById(Long id);

    List<WarehouseResponse> getAllWarehouses();
}
