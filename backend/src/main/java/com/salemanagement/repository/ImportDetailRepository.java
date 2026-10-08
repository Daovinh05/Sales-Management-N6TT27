package com.salemanagement.repository;

import com.salemanagement.entity.ImportDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportDetailRepository extends JpaRepository<ImportDetail, Long> {

    boolean existsByProductVariant_Code(String variantCode);
}
