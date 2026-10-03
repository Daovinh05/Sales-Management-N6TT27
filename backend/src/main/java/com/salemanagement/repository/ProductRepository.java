package com.salemanagement.repository;

import com.salemanagement.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String> {

    List<Product> findAllByOrderByCreatedAtDesc();

    @Query("select p from Product p where "
            + "(:code is null or :code = '' or lower(p.code) like lower(concat('%', :code, '%'))) and "
            + "(:name is null or :name = '' or lower(p.name) like lower(concat('%', :name, '%'))) "
            + "order by p.createdAt desc")
    List<Product> search(@Param("code") String code, @Param("name") String name);
}
