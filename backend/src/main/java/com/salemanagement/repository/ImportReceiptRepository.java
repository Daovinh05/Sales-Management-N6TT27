package com.salemanagement.repository;

import com.salemanagement.entity.ImportReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface ImportReceiptRepository extends JpaRepository<ImportReceipt, Long> {

    @Query(value = "SELECT ir FROM ImportReceipt ir JOIN FETCH ir.createdBy JOIN FETCH ir.supplier",
           countQuery = "SELECT count(ir) FROM ImportReceipt ir")
    Page<ImportReceipt> findAllWithDetails(Pageable pageable);

    @Query("SELECT ir FROM ImportReceipt ir JOIN FETCH ir.createdBy JOIN FETCH ir.supplier LEFT JOIN FETCH ir.details d LEFT JOIN FETCH d.productVariant WHERE ir.id = :id")
    Optional<ImportReceipt> findByIdWithFullDetails(@Param("id") Long id);
    @Query(value = "SELECT ir FROM ImportReceipt ir JOIN FETCH ir.supplier WHERE ir.createdBy.username = :username",
           countQuery = "SELECT count(ir) FROM ImportReceipt ir WHERE ir.createdBy.username = :username")
    Page<ImportReceipt> findByCreatedByUsernameWithDetails(@Param("username") String username, Pageable pageable);
}
