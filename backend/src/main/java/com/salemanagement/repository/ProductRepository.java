package com.salemanagement.repository;

import com.salemanagement.entity.Product;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, String> {

    List<Product> findAllByOrderByCreatedAtDesc();

    List<Product> findTop4ByCategory_CodeAndCodeNotOrderByCreatedAtDesc(String categoryCode, String code);

    List<Product> findTop4ByCodeNotOrderByCreatedAtDesc(String code);

    @Query("select p from Product p where "
            + "(:category is null or :category = '' or p.category.code = :category) and "
            + "(:brand is null or :brand = '' or p.brand.code = :brand) and "
            + "(:search is null or :search = '' or lower(p.name) like lower(concat('%', :search, '%')) "
            + "or lower(p.code) like lower(concat('%', :search, '%'))) and "
            + "(:minPrice is null or exists (select 1 from ProductVariant v where v.product = p and v.price >= :minPrice)) and "
            + "(:maxPrice is null or exists (select 1 from ProductVariant v where v.product = p and v.price < :maxPrice)) "
            + "order by p.createdAt desc")
    Page<Product> storefront(@Param("category") String category,
                             @Param("brand") String brand,
                             @Param("search") String search,
                             @Param("minPrice") BigDecimal minPrice,
                             @Param("maxPrice") BigDecimal maxPrice,
                             Pageable pageable);

    @Query("select p from Product p where "
            + "(:code is null or :code = '' or lower(p.code) like lower(concat('%', :code, '%'))) and "
            + "(:name is null or :name = '' or lower(p.name) like lower(concat('%', :name, '%'))) "
            + "order by p.createdAt desc")
    List<Product> search(@Param("code") String code, @Param("name") String name);
}
