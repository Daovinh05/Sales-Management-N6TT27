package com.salemanagement.config;

import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Order;
import com.salemanagement.entity.OrderDetail;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Role;
import com.salemanagement.entity.Supplier;
import com.salemanagement.entity.User;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.SupplierRepository;
import com.salemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedRolesAndAdmin(UserRepository userRepository, RoleRepository roleRepository) {
        return args -> {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name("ROLE_ADMIN").description("Quản lý toàn hệ thống").build()));
            Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name("ROLE_CUSTOMER").description("Khách hàng mua hàng").build()));
            roleRepository.findByName("ROLE_WAREHOUSE_STAFF")
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name("ROLE_WAREHOUSE_STAFF").description("Nhân viên kho").build()));

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
        };
    }

    @Bean
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
