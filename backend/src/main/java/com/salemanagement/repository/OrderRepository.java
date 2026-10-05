package com.salemanagement.repository;

import com.salemanagement.entity.Order;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByCodeContainingIgnoreCaseAndCustomerNameContainingIgnoreCaseOrderByCreatedAtDesc(
            String code, String customerName);

    List<Order> findByUsernameOrderByCreatedAtDesc(String username);
}
