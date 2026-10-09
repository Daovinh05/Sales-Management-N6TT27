package com.salemanagement.repository;

import com.salemanagement.entity.Order;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByCodeContainingIgnoreCaseAndCustomerNameContainingIgnoreCaseOrderByCreatedAtDesc(
            String code, String customerName);

    List<Order> findByUsernameOrderByCreatedAtDesc(String username);

    // Kiểm tra biến thể đã phát sinh đơn hàng chưa (OrderDetail chỉ lưu variantCode dạng String).
    @Query("select count(d) from Order o join o.details d where upper(d.variantCode) = upper(:variantCode)")
    long countByDetailsVariantCode(@Param("variantCode") String variantCode);

    // Lọc admin: chuỗi rỗng = tất cả; payment = 'EMPTY' là đơn chưa chọn phương thức.
    @Query("select o from Order o"
            + " where (:code = '' or upper(o.code) like upper(concat('%', :code, '%')))"
            + " and (:customer = '' or upper(o.customerName) like upper(concat('%', :customer, '%')))"
            + " and (:status = '' or o.status = :status)"
            + " and (:payment = ''"
            + " or (:payment = 'EMPTY' and o.paymentMethod is null)"
            + " or o.paymentMethod = :payment)"
            + " order by o.createdAt desc")
    List<Order> filter(@Param("code") String code,
                       @Param("customer") String customer,
                       @Param("status") String status,
                       @Param("payment") String payment);

    @Query("select o.status, count(o) from Order o"
            + " where o.createdAt between :from and :to group by o.status")
    List<Object[]> countByStatusBetween(@Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);

    @Query("select function('date', o.createdAt), sum(o.paymentAmount), count(o)"
            + " from Order o where o.status = :status and o.createdAt between :from and :to"
            + " group by function('date', o.createdAt) order by function('date', o.createdAt)")
    List<Object[]> revenueByDay(@Param("status") String status,
                                @Param("from") LocalDateTime from,
                                @Param("to") LocalDateTime to);
}
