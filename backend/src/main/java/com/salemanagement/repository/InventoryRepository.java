package com.salemanagement.repository;

import com.salemanagement.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByWarehouseId(Long warehouseId);
    Optional<Inventory> findByWarehouseIdAndProductVariant_Code(Long warehouseId, String variantCode);

    // Khóa dòng tồn kho khi giữ chỗ / trừ kho lúc đặt hàng để chống bán lố khi trùng request.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventory i where i.warehouse.id = :warehouseId and i.productVariant.code = :variantCode")
    Optional<Inventory> findByWarehouseIdAndProductVariant_CodeForUpdate(
            @Param("warehouseId") Long warehouseId,
            @Param("variantCode") String variantCode);
}
