package com.salemanagement.repository;

import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {

    List<ProductVariant> findAllByOrderByCreatedAtDesc();

    List<ProductVariant> findByProduct(Product product);

    Optional<ProductVariant> findFirstByProductOrderByCodeAsc(Product product);

    @Query("select v from ProductVariant v join fetch v.product where "
            + "(:code is null or :code = '' or lower(v.code) like lower(concat('%', :code, '%'))) and "
            + "(:name is null or :name = '' or lower(coalesce(v.name, '')) like lower(concat('%', :name, '%'))) "
            + "order by v.createdAt desc")
    List<ProductVariant> search(@Param("code") String code, @Param("name") String name);

    @Query(value = "select v from ProductVariant v join fetch v.product where "
            + "(:keyword is null or :keyword = '' or lower(v.code) like lower(concat('%', :keyword, '%')) or lower(coalesce(v.product.name, '')) like lower(concat('%', :keyword, '%')) or lower(coalesce(v.name, '')) like lower(concat('%', :keyword, '%')))",
           countQuery = "select count(v) from ProductVariant v where "
            + "(:keyword is null or :keyword = '' or lower(v.code) like lower(concat('%', :keyword, '%')) or lower(coalesce(v.product.name, '')) like lower(concat('%', :keyword, '%')) or lower(coalesce(v.name, '')) like lower(concat('%', :keyword, '%')))")
    org.springframework.data.domain.Page<ProductVariant> searchPaginated(@Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    boolean existsByProduct(Product product);

    @Query("select min(v.price), max(v.price) from ProductVariant v where v.product.code = :code")
    java.util.List<Object[]> findPriceBounds(@Param("code") String productCode);
}
