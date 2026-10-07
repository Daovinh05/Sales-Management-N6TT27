package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;

import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Supplier;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.SupplierRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CatalogRepositoryTests {

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BrandRepository brandRepository;
    @Autowired
    private SupplierRepository supplierRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductVariantRepository variantRepository;

    @Test
    void productFlow() {
        Category category = new Category();
        category.setCode("DM01");
        category.setName("Điện thoại");
        categoryRepository.save(category);

        Brand brand = new Brand();
        brand.setCode("TH01");
        brand.setName("Apple");
        brandRepository.save(brand);

        Supplier supplier = new Supplier();
        supplier.setCode("NCC01");
        supplier.setName("Nhà cung cấp 1");
        supplierRepository.save(supplier);

        Product product = new Product();
        product.setCode("SP01");
        product.setName("iPhone 17 Pro Max");
        product.setCategory(category);
        product.setBrand(brand);
        product.setSupplier(supplier);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setCode("BT01");
        variant.setProduct(product);
        variant.setName("256GB - Titan");
        variant.setColor("Titan");
        variant.setRam("8GB");
        variant.setStorage("256GB");
        variant.setPrice(new BigDecimal("34990000"));
        variantRepository.save(variant);

        assertThat(productRepository.search("sp01", "").size()).isEqualTo(1);
        assertThat(productRepository.search("", "iphone").size()).isEqualTo(1);
        assertThat(variantRepository.search("bt01", "").size()).isEqualTo(1);
        assertThat(variantRepository.findFirstByProductOrderByCodeAsc(product)).isPresent();
        assertThat(variantRepository.findByProduct(product).size()).isEqualTo(1);

        variantRepository.delete(variant);
        productRepository.delete(product);
        assertThat(productRepository.existsById("SP01")).isFalse();
    }
}
