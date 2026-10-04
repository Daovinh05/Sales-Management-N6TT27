package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;

import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@DataJpaTest
class StorefrontRepositoryTests {

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BrandRepository brandRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductVariantRepository variantRepository;

    private Product saveProduct(String code, String name, String categoryCode, String price) {
        Category category = categoryRepository.findById(categoryCode).orElseGet(() -> {
            Category created = new Category();
            created.setCode(categoryCode);
            created.setName("Danh mục " + categoryCode);
            return categoryRepository.save(created);
        });
        Brand brand = brandRepository.findById("TH01").orElseGet(() -> {
            Brand created = new Brand();
            created.setCode("TH01");
            created.setName("Apple");
            return brandRepository.save(created);
        });
        Product product = new Product();
        product.setCode(code);
        product.setName(name);
        product.setCategory(category);
        product.setBrand(brand);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setCode("BT-" + code);
        variant.setProduct(product);
        variant.setName("Mặc định");
        variant.setPrice(new BigDecimal(price));
        variant.setStockQuantity(5);
        variantRepository.save(variant);
        return product;
    }

    @Test
    void storefrontFiltersAndPaging() {
        saveProduct("SP01", "iPhone 17", "DM01", "34990000");
        saveProduct("SP02", "Tai nghe Sony", "DM08", "7490000");
        saveProduct("SP03", "Sạc Anker", "DM09", "990000");

        Page<Product> all = productRepository.storefront("", "", "", null, null, PageRequest.of(0, 8));
        assertThat(all.getTotalElements()).isEqualTo(3);

        Page<Product> byCategory = productRepository.storefront("DM01", "", "", null, null, PageRequest.of(0, 8));
        assertThat(byCategory.getTotalElements()).isEqualTo(1);

        Page<Product> byPrice = productRepository.storefront("", "", "",
                new BigDecimal("7000000"), new BigDecimal("13000000"), PageRequest.of(0, 8));
        assertThat(byPrice.getTotalElements()).isEqualTo(1);

        Page<Product> bySearch = productRepository.storefront("", "", "anker", null, null, PageRequest.of(0, 8));
        assertThat(bySearch.getTotalElements()).isEqualTo(1);

        Page<Product> page1 = productRepository.storefront("", "", "", null, null, PageRequest.of(1, 2));
        assertThat(page1.getContent()).hasSize(1);
        assertThat(page1.getTotalPages()).isEqualTo(2);

        assertThat(productRepository.findTop4ByCategory_CodeAndCodeNotOrderByCreatedAtDesc("DM01", "SP01")).isEmpty();
        assertThat(productRepository.findTop4ByCodeNotOrderByCreatedAtDesc("SP01")).hasSize(2);
    }
}
