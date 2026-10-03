package com.salemanagement.repository;

import com.salemanagement.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, String> {

    List<Category> findAllByOrderByCreatedAtDesc();

    boolean existsByNameIgnoreCase(String name);
}