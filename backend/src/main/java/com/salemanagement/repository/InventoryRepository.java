package com.salemanagement.repository;

import com.salemanagement.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByWarehouseId(Long warehouseId);
    java.util.Optional<Inventory> findByWarehouseIdAndProductVariant_Code(Long warehouseId, String variantCode);
}
