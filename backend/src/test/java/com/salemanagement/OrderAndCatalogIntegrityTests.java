package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.salemanagement.dto.request.ImportReceiptRequest;
import com.salemanagement.dto.request.OrderRequest;
import com.salemanagement.dto.request.ProductVariantUpdateRequest;
import com.salemanagement.dto.response.OrderResponse;
import com.salemanagement.dto.response.ProductResponse;
import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Inventory;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Supplier;
import com.salemanagement.entity.User;
import com.salemanagement.entity.Warehouse;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CartItemRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.ImportDetailRepository;
import com.salemanagement.repository.ImportReceiptRepository;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.SupplierRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.repository.WarehouseRepository;
import com.salemanagement.service.FileStorageService;
import com.salemanagement.service.impl.OrderServiceImpl;
import com.salemanagement.service.impl.ProductServiceImpl;
import com.salemanagement.service.impl.ProductVariantServiceImpl;
import com.salemanagement.service.impl.WarehouseStaffServiceImpl;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.multipart.MultipartFile;

@DataJpaTest
class OrderAndCatalogIntegrityTests {

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private InventoryRepository inventoryRepository;
    @Autowired
    private ProductVariantRepository variantRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BrandRepository brandRepository;
    @Autowired
    private SupplierRepository supplierRepository;
    @Autowired
    private CartItemRepository cartItemRepository;
    @Autowired
    private ImportDetailRepository importDetailRepository;
    @Autowired
    private ImportReceiptRepository importReceiptRepository;
    @Autowired
    private WarehouseRepository warehouseRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private OrderServiceImpl orderService;
    private ProductServiceImpl productService;
    private ProductVariantServiceImpl variantService;
    private WarehouseStaffServiceImpl staffService;

    private Product testProduct1;
    private Product testProduct2;
    private ProductVariant variantA;
    private ProductVariant variantB;
    private User testUser;
    private Supplier testSupplier;

    private final FileStorageService noopFileStorage = new FileStorageService() {
        @Override
        public String storeVariantImage(MultipartFile file) { return "test.jpg"; }
        @Override
        public void deleteVariantImage(String filename) {}
        @Override
        public String storeUserAvatar(MultipartFile file) { return "avatar.jpg"; }
        @Override
        public void deleteUserAvatar(String filename) {}
    };

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("ALTER TABLE warehouse ALTER COLUMN id RESTART WITH 1");

        Warehouse centralWarehouse = new Warehouse();
        centralWarehouse.setName("Kho Tong");
        centralWarehouse = warehouseRepository.save(centralWarehouse);

        orderService = new OrderServiceImpl(orderRepository, inventoryRepository, variantRepository);
        productService = new ProductServiceImpl(
                productRepository, variantRepository, categoryRepository,
                brandRepository, supplierRepository, cartItemRepository, inventoryRepository,
                importDetailRepository, orderRepository);
        variantService = new ProductVariantServiceImpl(
                variantRepository, productRepository, noopFileStorage, cartItemRepository,
                inventoryRepository, importDetailRepository, orderRepository);
        staffService = new WarehouseStaffServiceImpl(
                importReceiptRepository, userRepository, supplierRepository,
                variantRepository, inventoryRepository, warehouseRepository);

        Category category = new Category();
        category.setCode("DM01");
        category.setName("Điện thoại");
        categoryRepository.save(category);

        Brand brand = new Brand();
        brand.setCode("TH01");
        brand.setName("Apple");
        brandRepository.save(brand);

        testSupplier = new Supplier();
        testSupplier.setCode("NCC01");
        testSupplier.setName("Nhà cung cấp 1");
        supplierRepository.save(testSupplier);

        testProduct1 = new Product();
        testProduct1.setCode("SP01");
        testProduct1.setName("iPhone 17");
        testProduct1.setCategory(category);
        testProduct1.setBrand(brand);
        testProduct1.setSupplier(testSupplier);
        productRepository.save(testProduct1);

        testProduct2 = new Product();
        testProduct2.setCode("SP02");
        testProduct2.setName("iPhone 16");
        testProduct2.setCategory(category);
        testProduct2.setBrand(brand);
        testProduct2.setSupplier(testSupplier);
        productRepository.save(testProduct2);

        variantA = new ProductVariant();
        variantA.setCode("V01_A");
        variantA.setProduct(testProduct1);
        variantA.setName("128GB");
        variantA.setPrice(new BigDecimal("10000000"));
        variantRepository.save(variantA);

        variantB = new ProductVariant();
        variantB.setCode("V01_B");
        variantB.setProduct(testProduct1);
        variantB.setName("256GB");
        variantB.setPrice(new BigDecimal("15000000"));
        variantRepository.save(variantB);

        // Variant A: tồn = 0
        Inventory invA = new Inventory();
        invA.setWarehouse(centralWarehouse);
        invA.setProductVariant(variantA);
        invA.setQuantity(0);
        invA.setReservedQuantity(0);
        inventoryRepository.save(invA);

        // Variant B: tồn = 10
        Inventory invB = new Inventory();
        invB.setWarehouse(centralWarehouse);
        invB.setProductVariant(variantB);
        invB.setQuantity(10);
        invB.setReservedQuantity(0);
        inventoryRepository.save(invB);

        testUser = new User();
        testUser.setUsername("teststaff");
        testUser.setPassword("password");
        userRepository.save(testUser);
    }

    @Test
    void test3_createOrder_ignoresClientSpoofedUnitPrice_usesVariantPrice() {
        // Client gửi unitPrice = 0 hoặc 100đ, nhưng variantB có giá 15.000.000đ
        OrderRequest.OrderItemRequest spoofedItem = new OrderRequest.OrderItemRequest(
                "V01_B", "iPhone 17 - 256GB", 2, new BigDecimal("100"));

        OrderRequest request = new OrderRequest(
                "Nguyễn Văn A", "0901234567", "a@example.com", "Hà Nội",
                "Giao nhanh", "COD", BigDecimal.ZERO, List.of(spoofedItem));

        OrderResponse response = orderService.create(request, "customer");

        assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("30000000"));
        assertThat(response.paymentAmount()).isEqualByComparingTo(new BigDecimal("30000000"));
        assertThat(response.details()).hasSize(1);
        assertThat(response.details().get(0).unitPrice()).isEqualByComparingTo(new BigDecimal("15000000"));
    }

    @Test
    void test4_productStock_sumsAvailableStockAcrossAllVariants() {
        // Variant A có tồn = 0, Variant B có tồn = 10 -> Tổng tồn SP01 phải là 10, không phải 0
        ProductResponse response = productService.getDetail("SP01");
        assertThat(response.getStockQuantity()).isEqualTo(10);
    }

    @Test
    void test5_updateVariant_disallowsChangingProductCode_whenInventoryExists() {
        // Variant B đã có bản ghi tồn kho, cố tình đổi sang SP02 phải bị chặn 409 CONFLICT
        ProductVariantUpdateRequest updateReq = new ProductVariantUpdateRequest();
        updateReq.setProductCode("SP02");
        updateReq.setName("256GB Đổi SP");
        updateReq.setColor("Đen");
        updateReq.setRam("8GB");
        updateReq.setStorage("256GB");
        updateReq.setPrice(new BigDecimal("15000000"));

        assertThatThrownBy(() -> variantService.update("V01_B", updateReq, null))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void test5_warehouseImportReceipt_noCrashWhenVariantPriceIsNull() {
        // Variant mới chưa set giá bán (price = null)
        ProductVariant variantNullPrice = new ProductVariant();
        variantNullPrice.setCode("V_NULL");
        variantNullPrice.setProduct(testProduct1);
        variantNullPrice.setName("Bản mẫu");
        variantNullPrice.setPrice(null);
        variantRepository.save(variantNullPrice);

        ImportReceiptRequest.ItemRequest itemReq = new ImportReceiptRequest.ItemRequest();
        itemReq.setVariantCode("V_NULL");
        itemReq.setQuantity(5);
        itemReq.setImportPrice(new BigDecimal("8000000"));

        ImportReceiptRequest receiptRequest = new ImportReceiptRequest();
        receiptRequest.setSupplierCode("NCC01");
        receiptRequest.setNote("Nhập bản mẫu");
        receiptRequest.setDetails(List.of(itemReq));

        // Không bị ném NullPointerException khi compareTo
        staffService.createImport(receiptRequest, "teststaff");
        assertThat(importReceiptRepository.count()).isEqualTo(1);
    }
}
