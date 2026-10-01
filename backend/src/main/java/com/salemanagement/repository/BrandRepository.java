package com.salemanagement.repository;

import com.salemanagement.entity.Brand;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, String> {

    List<Brand> findAllByOrderByCreatedAtDesc();

    boolean existsByNameIgnoreCase(String name);
}