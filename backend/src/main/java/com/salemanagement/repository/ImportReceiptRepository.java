package com.salemanagement.repository;

import com.salemanagement.entity.ImportReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportReceiptRepository extends JpaRepository<ImportReceipt, Long> {
}
