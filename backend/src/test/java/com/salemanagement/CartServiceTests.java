package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.salemanagement.dto.request.CartAddRequest;
import com.salemanagement.dto.request.CartUpdateRequest;
import com.salemanagement.dto.response.CartResponse;
import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.User;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CartItemRepository;
import com.salemanagement.repository.CartRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.SupplierRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.service.FileStorageService;
import com.salemanagement.service.impl.CartServiceImpl;
import com.salemanagement.service.impl.ProductServiceImpl;
import com.salemanagement.service.impl.ProductVariantServiceImpl;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

@DataJpaTest
class CartServiceTests {

    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private CartItemRepository cartItemRepository;
    @Autowired
    private ProductVariantRepository variantRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BrandRepository brandRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SupplierRepository supplierRepository;

    private CartServiceImpl cartService;
    private User user;

    @BeforeEach
    void setUp() {
        cartService = new CartServiceImpl(cartRepository, cartItemRepository, variantRepository);

        Category category = new Category();
        category.setCode("DM01");
        category.setName("Điện thoại");
        categoryRepository.save(category);

        Brand brand = new Brand();
        brand.setCode("TH01");
        brand.setName("Apple");
        brandRepository.save(brand);

        Product product = new Product();
        product.setCode("SP01");
        product.setName("iPhone 17");
        product.setCategory(category);
        product.setBrand(brand);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setCode("BT01");
        variant.setProduct(product);
        variant.setName("256GB");
        variant.setPrice(new BigDecimal("1000000"));
        variant.setStockQuantity(5);
        variantRepository.save(variant);

        user = new User();
        user.setUsername("cartuser");
        user.setPassword("secret");
        userRepository.save(user);
    }

    private CartAddRequest addRequest(String variantCode, int quantity) {
        CartAddRequest request = new CartAddRequest();
        request.setVariantCode(variantCode);
        request.setQuantity(quantity);
        return request;
    }

    @Test
    void addUpsertAndSummary() {
        CartResponse first = cartService.addItem(user, addRequest("BT01", 2));
        assertThat(first.getTotalItems()).isEqualTo(1);
        assertThat(first.getTotalQuantity()).isEqualTo(2);
        assertThat(first.getSubtotal()).isEqualByComparingTo(new BigDecimal("2000000"));

        CartResponse second = cartService.addItem(user, addRequest("BT01", 1));
        assertThat(second.getTotalQuantity()).isEqualTo(3);
        assertThat(second.getItems().get(0).getLineTotal()).isEqualByComparingTo(new BigDecimal("3000000"));
    }

    @Test
    void addOverStockRejected() {
        assertThatThrownBy(() -> cartService.addItem(user, addRequest("BT01", 6)))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        cartService.addItem(user, addRequest("BT01", 3));
        assertThatThrownBy(() -> cartService.addItem(user, addRequest("BT01", 3)))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void updateRemoveAndClear() {
        cartService.addItem(user, addRequest("BT01", 2));

        CartUpdateRequest update = new CartUpdateRequest();
        update.setQuantity(4);
        assertThat(cartService.updateQuantity(user, "BT01", update).getTotalQuantity()).isEqualTo(4);

        update.setQuantity(6);
        assertThatThrownBy(() -> cartService.updateQuantity(user, "BT01", update))
                .isInstanceOf(BusinessException.class);

        assertThat(cartService.removeItem(user, "BT01").getTotalItems()).isZero();

        cartService.addItem(user, addRequest("BT01", 1));
        cartService.clear(user);
        assertThat(cartService.getCart(user).getTotalItems()).isZero();
    }

    @Test
    void addWithoutQuantityDefaultsToOne() {
        CartAddRequest request = new CartAddRequest();
        request.setVariantCode("BT01");
        request.setQuantity(null);
        assertThat(cartService.addItem(user, request).getTotalQuantity()).isEqualTo(1);
    }

    @Test
    void deleteVariantClearsCartLines() {
        cartService.addItem(user, addRequest("BT01", 2));
        FileStorageService files = new FileStorageService() {
            @Override
            public String storeVariantImage(MultipartFile file) {
                return null;
            }

            @Override
            public void deleteVariantImage(String filename) {
            }

            @Override
            public String storeUserAvatar(MultipartFile file) {
                return null;
            }

            @Override
            public void deleteUserAvatar(String filename) {
            }
        };
        ProductVariantServiceImpl variantService = new ProductVariantServiceImpl(
                variantRepository, productRepository, files, cartItemRepository);
        variantService.delete("BT01");
        assertThat(cartService.getCart(user).getTotalItems()).isZero();
        assertThat(variantRepository.existsById("BT01")).isFalse();
    }

    @Test
    void deleteProductClearsCartLines() {
        cartService.addItem(user, addRequest("BT01", 2));
        ProductServiceImpl productService = new ProductServiceImpl(
                productRepository, variantRepository, categoryRepository,
                brandRepository, supplierRepository, cartItemRepository);
        productService.delete("SP01");
        assertThat(cartService.getCart(user).getTotalItems()).isZero();
        assertThat(productRepository.existsById("SP01")).isFalse();
    }

    @Test
    void unknownVariantNotFound() {
        assertThatThrownBy(() -> cartService.addItem(user, addRequest("BT99", 1)))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
