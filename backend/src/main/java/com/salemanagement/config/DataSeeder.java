package com.salemanagement.config;

import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Order;
import com.salemanagement.entity.OrderDetail;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Role;
import com.salemanagement.enums.ERole;
import com.salemanagement.entity.Supplier;
import com.salemanagement.entity.User;
import com.salemanagement.entity.Warehouse;
import com.salemanagement.entity.Inventory;
import com.salemanagement.entity.Promotion;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.SupplierRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.PromotionRepository;
import com.salemanagement.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedRolesAndAdmin(UserRepository userRepository, RoleRepository roleRepository) {
        return args -> {
            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(ERole.ROLE_ADMIN).description("Quản lý toàn hệ thống").build()));
            Role customerRole = roleRepository.findByName(ERole.ROLE_CUSTOMER)
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(ERole.ROLE_CUSTOMER).description("Khách hàng mua hàng").build()));
            roleRepository.findByName(ERole.ROLE_WAREHOUSE_STAFF)
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(ERole.ROLE_WAREHOUSE_STAFF).description("Nhân viên kho").build()));
            Role warehouseStaffRole = roleRepository.findByName(ERole.ROLE_WAREHOUSE_STAFF).orElseThrow();

            if (!userRepository.existsByUsername("admin")) {
                userRepository.save(User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("123456"))
                        .fullName("Administrator")
                        .email("admin@shop.com")
                        .status("ACTIVE")
                        .roles(Set.of(adminRole))
                        .build());
            }

            if (!userRepository.existsByUsername("customer")) {
                userRepository.save(User.builder()
                        .username("customer")
                        .password(passwordEncoder.encode("123456"))
                        .fullName("Khách hàng mẫu")
                        .email("customer@shop.com")
                        .status("ACTIVE")
                        .roles(Set.of(customerRole))
                        .build());
            }

            // Nhân viên quản lý kho mẫu
            if (!userRepository.existsByUsername("kho1")) {
                userRepository.save(User.builder()
                        .username("kho1")
                        .password(passwordEncoder.encode("123456"))
                        .fullName("Nhân viên Kho 1")
                        .email("kho1@shop.com")
                        .phone("0901111111")
                        .address("Kho trung tâm - Hà Nội")
                        .status("ACTIVE")
                        .roles(Set.of(warehouseStaffRole))
                        .build());
            }

            if (!userRepository.existsByUsername("kho2")) {
                userRepository.save(User.builder()
                        .username("kho2")
                        .password(passwordEncoder.encode("123456"))
                        .fullName("Nhân viên Kho 2")
                        .email("kho2@shop.com")
                        .phone("0902222222")
                        .address("Kho trung tâm - Hà Nội")
                        .status("ACTIVE")
                        .roles(Set.of(warehouseStaffRole))
                        .build());
            }
        };
    }

    @Bean
    @org.springframework.core.annotation.Order(1)
    CommandLineRunner seedCatalog(CategoryRepository categoryRepository,
                                  BrandRepository brandRepository,
                                  SupplierRepository supplierRepository,
                                  ProductRepository productRepository,
                                  ProductVariantRepository variantRepository) {
        return args -> {
            Category phoneCategory = categoryRepository.findById("DM01")
                    .orElseGet(() -> {
                        Category category = new Category();
                        category.setCode("DM01");
                        category.setName("Điện thoại");
                        return categoryRepository.save(category);
                    });
            if (!brandRepository.existsById("TH01")) {
                Brand brand = new Brand();
                brand.setCode("TH01");
                brand.setName("Apple");
                brandRepository.save(brand);
            }
            if (!brandRepository.existsById("TH02")) {
                Brand brand = new Brand();
                brand.setCode("TH02");
                brand.setName("Samsung");
                brandRepository.save(brand);
            }
            Supplier supplier = supplierRepository.findById("NCC01")
                    .orElseGet(() -> {
                        Supplier created = new Supplier();
                        created.setCode("NCC01");
                        created.setName("Nhà cung cấp 1");
                        return supplierRepository.save(created);
                    });

            if (!productRepository.existsById("SP01")) {
                Product product = new Product();
                product.setCode("SP01");
                product.setName("iPhone 17 Pro Max 256GB");
                product.setCategory(phoneCategory);
                product.setBrand(brandRepository.findById("TH01").orElse(null));
                product.setSupplier(supplier);
                productRepository.save(product);

                if (!variantRepository.existsById("BT01")) {
                    ProductVariant variant = new ProductVariant();
                    variant.setCode("BT01");
                    variant.setProduct(product);
                    variant.setName("256GB - Titan Tự Nhiên");
                    variant.setColor("Titan Tự Nhiên");
                    variant.setRam("8GB");
                    variant.setStorage("256GB");
                    variant.setPrice(new BigDecimal("34990000"));
                    /* variant.setStockQuantity(10); */
                    variant.setImageUrl("https://picsum.photos/seed/bt01/800/800");
                    variantRepository.save(variant);
                }
            }
            // Bù ảnh cho dữ liệu seed cũ chưa có ảnh.
            variantRepository.findById("BT01").ifPresent(existing -> {
                if (existing.getImageUrl() == null || existing.getImageUrl().isBlank()) {
                    existing.setImageUrl("https://picsum.photos/seed/bt01/800/800");
                    variantRepository.save(existing);
                }
            });

            // Thêm 2 biến thể cho SP01 đúng mẫu trang chi tiết (3 thumbnails + 3 nút chọn).
            Product sp01 = productRepository.findById("SP01").orElse(null);
            if (sp01 != null) {
                seedVariant(variantRepository, sp01,
                        "BT06", "Cam vũ trụ - 256GB - 8GB", "Cam vũ trụ", "8GB", "256GB",
                        "29990000", 8, "bt06");
                seedVariant(variantRepository, sp01,
                        "BT07", "Đen - 512GB - 8GB", "Đen", "8GB", "512GB",
                        "35990000", 19, "bt07");
            }

            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP02", "iPhone 16 128GB", "TH01",
                    "BT02", "128GB - Đen", "Đen", "8GB", "128GB", "21490000", 8, "bt02");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP03", "iPhone 15 128GB", "TH01",
                    "BT03", "128GB - Xanh", "Xanh", "6GB", "128GB", "18990000", 0, "bt03");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP04", "Samsung Galaxy S25 Ultra", "TH02",
                    "BT04", "12GB/256GB - Xám", "Xám", "12GB", "256GB", "27490000", 6, "bt04");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP05", "Samsung Galaxy Z Flip 6", "TH02",
                    "BT05", "8GB/256GB - Bạc", "Bạc", "8GB", "256GB", "26990000", 3, "bt05");
        };
    }

    private void seedVariant(ProductVariantRepository variantRepository,
                               Product product,
                               String variantCode, String variantName, String color,
                               String ram, String storage, String price, int stock,
                               String imageSeed) {
        if (variantRepository.existsById(variantCode)) {
            return;
        }
        ProductVariant variant = new ProductVariant();
        variant.setCode(variantCode);
        variant.setProduct(product);
        variant.setName(variantName);
        variant.setColor(color);
        variant.setRam(ram);
        variant.setStorage(storage);
        variant.setPrice(new BigDecimal(price));
        /* variant.setStockQuantity(stock); */
        variant.setImageUrl("https://picsum.photos/seed/" + imageSeed + "/800/800");
        variantRepository.save(variant);
    }

    private void seedProduct(ProductRepository productRepository,
                             ProductVariantRepository variantRepository,
                             BrandRepository brandRepository,
                             Supplier supplier,
                             Category category,
                             String productCode, String productName, String brandCode,
                             String variantCode, String variantName, String color,
                             String ram, String storage, String price, int stock,
                             String imageSeed) {
        if (productRepository.existsById(productCode)) {
            return;
        }
        Product product = new Product();
        product.setCode(productCode);
        product.setName(productName);
        product.setCategory(category);
        product.setBrand(brandRepository.findById(brandCode).orElse(null));
        product.setSupplier(supplier);
        productRepository.save(product);

        seedVariant(variantRepository, product, variantCode, variantName, color,
                ram, storage, price, stock, imageSeed);
    }

    @Bean
    @org.springframework.core.annotation.Order(2)
    CommandLineRunner seedWarehouse(WarehouseRepository warehouseRepository) {
        return args -> {
            // Code nghiệp vụ đang cứng warehouse id = 1 (WarehouseStaffServiceImpl, WarehouseAdminServiceImpl).
            // Nếu bảng warehouse trống thì mọi API nhập kho đều 404 "Không tìm thấy kho".
            if (warehouseRepository.count() == 0) {
                warehouseRepository.save(Warehouse.builder()
                        .name("Kho trung tâm")
                        .address("Hà Nội")
                        .phone("0900000000")
                        .status("ACTIVE")
                        .build());
            }
        };
    }

    @Bean
    @org.springframework.core.annotation.Order(3)
    CommandLineRunner seedInventory(WarehouseRepository warehouseRepository,
                                    ProductVariantRepository variantRepository,
                                    InventoryRepository inventoryRepository) {
        return args -> {
            // Tồn mẫu khớp số lượng dự kiến của biến thể (BT03 hết hàng mẫu để test).
            // Cần chạy sau seedCatalog (biến thể) và seedWarehouse (kho id = 1).
            Warehouse warehouse = warehouseRepository.findById(1L).orElse(null);
            if (warehouse == null) {
                return;
            }
            seedInventoryRow(inventoryRepository, variantRepository, warehouse, "BT01", 10);
            seedInventoryRow(inventoryRepository, variantRepository, warehouse, "BT06", 8);
            seedInventoryRow(inventoryRepository, variantRepository, warehouse, "BT07", 19);
            seedInventoryRow(inventoryRepository, variantRepository, warehouse, "BT02", 8);
            seedInventoryRow(inventoryRepository, variantRepository, warehouse, "BT04", 6);
            seedInventoryRow(inventoryRepository, variantRepository, warehouse, "BT05", 3);
        };
    }

    private void seedInventoryRow(InventoryRepository inventoryRepository,
                                 ProductVariantRepository variantRepository,
                                 Warehouse warehouse,
                                 String variantCode, int quantity) {
        if (inventoryRepository
                .findByWarehouseIdAndProductVariant_Code(warehouse.getId(), variantCode).isPresent()) {
            return;
        }
        variantRepository.findById(variantCode).ifPresent(variant ->
                inventoryRepository.save(Inventory.builder()
                        .warehouse(warehouse)
                        .productVariant(variant)
                        .quantity(quantity)
                        .reservedQuantity(0)
                        .build()));
    }

    @Bean
    CommandLineRunner seedPromotions(PromotionRepository promotionRepository) {
        return args -> {
            // Ngày tương đối so với hiện tại để đủ 3 trạng thái: đang, sắp diễn ra, hết hạn.
            LocalDateTime now = LocalDateTime.now();
            seedPromotion(promotionRepository, "KM01", "Chào Hè 2026", "500000",
                    now.minusMonths(4), now.minusMonths(2));
            seedPromotion(promotionRepository, "KM02", "Black Friday", "1000000",
                    now.plusDays(20), now.plusDays(30));
            seedPromotion(promotionRepository, "KM03", "Khách hàng mới", "200000",
                    now.minusMonths(1), now.plusMonths(2));
            seedPromotion(promotionRepository, "KM04", "Giảm giá Tết", "300000",
                    now.minusMonths(8), now.minusMonths(7));
            seedPromotion(promotionRepository, "KM05", "Sale cuối tuần", "200000",
                    now.minusDays(2), now.plusDays(5));
            seedPromotion(promotionRepository, "KM06", "Flash Sale", "500000",
                    now.minusHours(1), now.plusHours(23));
            seedPromotion(promotionRepository, "KM07", "Mừng khai trương", "123000",
                    now.minusDays(10), now.plusMonths(1));
        };
    }

    private void seedPromotion(PromotionRepository promotionRepository,
                               String code, String name, String discount,
                               LocalDateTime startsAt, LocalDateTime endsAt) {
        if (promotionRepository.existsById(code)) {
            return;
        }
        Promotion promotion = new Promotion();
        promotion.setCode(code);
        promotion.setName(name);
        promotion.setDiscountAmount(new BigDecimal(discount));
        promotion.setStartsAt(startsAt);
        promotion.setEndsAt(endsAt);
        promotionRepository.save(promotion);
    }

    @Bean
    CommandLineRunner seedOrders(OrderRepository orderRepository) {
        return args -> {
            if (orderRepository.count() > 0) {
                return;
            }
            String[][] samples = {
                    {"DH08", "Trần Văn Minh", "0902222222", "minh.tran@gmail.com", "Hà Đông", "Giao giờ hành chính",
                            "27900000", "123000", "27777000", Order.STATUS_PENDING},
                    {"DH07", "Nguyễn Thị Lan", "0913333333", "lan.nguyen@gmail.com", "Cầu Giấy", "",
                            "15990000", "500000", "15490000", Order.STATUS_CONFIRMED},
                    {"DH06", "Lê Hoàng Nam", "0924444444", "nam.le@gmail.com", "Thanh Xuân", "Gọi trước khi giao",
                            "8990000", "0", "8990000", Order.STATUS_SHIPPING},
                    {"DH05", "Phạm Thu Hà", "0935555555", "ha.pham@gmail.com", "Hai Bà Trưng", "",
                            "29990000", "1000000", "28990000", Order.STATUS_COMPLETED},
                    {"DH04", "Trần Văn Minh", "0902222222", "minh.tran@gmail.com", "Hà Đông", "Không có ghi chú",
                            "12990000", "0", "12990000", Order.STATUS_PENDING},
                    {"DH03", "Đỗ Quang Anh", "0946666666", "anh.do@gmail.com", "Hoàng Mai", "",
                            "21990000", "500000", "21490000", Order.STATUS_CANCELLED},
                    {"DH02", "Hoàng Văn Thành", "0957777777", "thanh.hoang@gmail.com", "Đống Đa", "",
                            "18990000", "0", "18990000", Order.STATUS_COMPLETED},
                    {"DH01", "Đào Văn Vinh", "0968888888", "vinh.dao@gmail.com", "Hà Đông", "Xuất hóa đơn công ty",
                            "34990000", "2000000", "32990000", Order.STATUS_COMPLETED}
            };
            for (String[] sample : samples) {
                Order order = new Order();
                order.setCode(sample[0]);
                order.setCustomerName(sample[1]);
                order.setCustomerPhone(sample[2]);
                order.setEmail(sample[3].isEmpty() ? null : sample[3]);
                order.setShippingAddress(sample[4].isEmpty() ? null : sample[4]);
                order.setNote(sample[5].isEmpty() ? null : sample[5]);
                order.setTotalAmount(new BigDecimal(sample[6]));
                order.setDiscountAmount(new BigDecimal(sample[7]));
                order.setPaymentAmount(new BigDecimal(sample[8]));
                order.setStatus(sample[9]);

                OrderDetail detail = new OrderDetail();
                detail.setOrder(order);
                detail.setVariantCode("BT01");
                detail.setProductName("iPhone 17 Pro Max 256GB - Titan Tự Nhiên");
                detail.setQuantity(1);
                detail.setUnitPrice(new BigDecimal(sample[6]));
                order.getDetails().add(detail);

                orderRepository.save(order);
            }
        };
    }
}
