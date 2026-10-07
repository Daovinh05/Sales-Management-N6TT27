package com.salemanagement.repository;

import com.salemanagement.entity.Order;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByCodeContainingIgnoreCaseAndCustomerNameContainingIgnoreCaseOrderByCreatedAtDesc(
            String code, String customerName);

    List<Order> findByUsernameOrderByCreatedAtDesc(String username);

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
}
