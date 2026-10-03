package com.salemanagement.repository;

import com.salemanagement.entity.Promotion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionRepository extends JpaRepository<Promotion, String> {

    List<Promotion> findAllByOrderByCreatedAtDesc();
}