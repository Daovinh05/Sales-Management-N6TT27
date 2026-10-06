package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;

import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Review;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.ReviewRepository;
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
    @Autowired
    private ReviewRepository reviewRepository;

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

    @Test
    void priceBoundsAndRandom() {
        saveProduct("SP20", "Pin sạc", "DM09", "990000");

        java.util.List<Object[]> rows = variantRepository.findPriceBounds("SP20");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)).hasSize(2);
        assertThat((java.math.BigDecimal) rows.get(0)[0]).isEqualByComparingTo(new java.math.BigDecimal("990000"));
        assertThat((java.math.BigDecimal) rows.get(0)[1]).isEqualByComparingTo(new java.math.BigDecimal("990000"));

        java.util.List<Object[]> missing = variantRepository.findPriceBounds("SP99");
        assertThat(missing).hasSize(1);
        assertThat(missing.get(0)[0]).isNull();
        assertThat(missing.get(0)[1]).isNull();

        var random = productRepository.findRandom(org.springframework.data.domain.PageRequest.of(0, 7));
        assertThat(random).hasSize(1);
        assertThat(random.get(0).getCode()).isEqualTo("SP20");
    }

    @Test
    void reviewsByProductName() {
        saveProduct("SP10", "Pin dự phòng", "DM09", "990000");

        Review first = new Review();
        first.setCustomerName("Khách A");
        first.setProductName("Pin dự phòng");
        first.setRating(5);
        first.setContent("Rất tốt");
        reviewRepository.save(first);

        Review second = new Review();
        second.setCustomerName("Khách B");
        second.setProductName("Pin dự phòng");
        second.setRating(4);
        second.setContent("Ổn");
        reviewRepository.save(second);

        assertThat(reviewRepository.findByProductNameOrderByCreatedAtDesc("Pin dự phòng")).hasSize(2);
        assertThat(reviewRepository.findByProductNameOrderByCreatedAtDesc("Không tồn tại")).isEmpty();
    }
}
