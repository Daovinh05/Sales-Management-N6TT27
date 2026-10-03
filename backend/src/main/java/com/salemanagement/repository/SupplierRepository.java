package com.salemanagement.repository;

import com.salemanagement.entity.Supplier;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, String> {

    List<Supplier> findAllByOrderByCreatedAtDesc();

    boolean existsByNameIgnoreCase(String name);
}