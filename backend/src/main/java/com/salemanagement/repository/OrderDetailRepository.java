package com.salemanagement.repository;

import com.salemanagement.entity.OrderDetail;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {

    @Query("select d.variantCode, d.productName, d.unitPrice, sum(d.quantity)"
            + " from OrderDetail d where d.order.status = :status"
            + " and d.order.createdAt between :from and :to"
            + " group by d.variantCode, d.productName, d.unitPrice"
            + " order by sum(d.quantity) desc")
    List<Object[]> topSelling(@Param("status") String status,
                              @Param("from") LocalDateTime from,
                              @Param("to") LocalDateTime to);
}
