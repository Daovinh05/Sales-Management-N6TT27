package com.salemanagement.service.warehouse;

import com.salemanagement.dto.request.WarehouseRequest;
import com.salemanagement.dto.response.InventoryResponse;
import com.salemanagement.dto.response.WarehouseResponse;

import java.util.List;

public interface WarehouseService {

    WarehouseResponse updateWarehouse(WarehouseRequest request);

    WarehouseResponse getWarehouse();

    List<InventoryResponse> getWarehouseInventory();
}
