package com.salemanagement.config;

import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Order;
import com.salemanagement.entity.OrderDetail;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Promotion;
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
import com.salemanagement.repository.PromotionRepository;
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
            seedBrand(brandRepository, "TH03", "Xiaomi");
            seedBrand(brandRepository, "TH04", "OPPO");
            seedBrand(brandRepository, "TH05", "Vivo");
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
                    variant.setStockQuantity(10);
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
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP06", "iPhone 17 256GB", "TH01",
                    "BT08", "256GB - Black", "Black", "8GB", "256GB", "24990000", 12, "bt08");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP07", "iPhone 17 Pro 256GB", "TH01",
                    "BT09", "256GB - Deep Blue", "Deep Blue", "12GB", "256GB", "34990000", 8, "bt09");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP08", "iPhone 16 Pro Max 256GB", "TH01",
                    "BT10", "256GB - Natural Titanium", "Natural Titanium", "8GB", "256GB", "31990000", 6, "bt10");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP09", "Samsung Galaxy S25+ 256GB", "TH02",
                    "BT11", "12GB/256GB - Navy", "Navy", "12GB", "256GB", "23990000", 9, "bt11");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP10", "Samsung Galaxy S24 FE 256GB", "TH02",
                    "BT12", "8GB/256GB - Graphite", "Graphite", "8GB", "256GB", "14990000", 14, "bt12");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP11", "Samsung Galaxy Z Flip7 256GB", "TH02",
                    "BT13", "12GB/256GB - Blue Shadow", "Blue Shadow", "12GB", "256GB", "27990000", 5, "bt13");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP12", "Xiaomi 15 5G 256GB", "TH03",
                    "BT14", "12GB/256GB - Green", "Green", "12GB", "256GB", "22990000", 10, "bt14");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP13", "Xiaomi Redmi Note 14 Pro+ 5G", "TH03",
                    "BT15", "12GB/256GB - Lavender", "Lavender", "12GB", "256GB", "10990000", 16, "bt15");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP14", "OPPO Reno13 5G 256GB", "TH04",
                    "BT16", "12GB/256GB - Plume White", "Plume White", "12GB", "256GB", "15990000", 7, "bt16");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP15", "Vivo V50 5G 256GB", "TH05",
                    "BT17", "12GB/256GB - Rose Red", "Rose Red", "12GB", "256GB", "13990000", 11, "bt17");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP16", "Samsung Galaxy A56 5G 256GB", "TH02",
                    "BT18", "8GB/256GB - Awesome Graphite", "Awesome Graphite", "8GB", "256GB", "10990000", 10, "bt18");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP17", "iPhone 17 Pro Max 512GB", "TH01",
                    "BT19", "512GB - Deep Blue", "Deep Blue", "12GB", "512GB", "38990000", 7, "bt19");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP18", "iPhone 17 Air 256GB", "TH01",
                    "BT20", "256GB - Sky Blue", "Sky Blue", "8GB", "256GB", "29990000", 9, "bt20");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP19", "iPhone 16 Pro 256GB", "TH01",
                    "BT21", "256GB - Natural Titanium", "Natural Titanium", "8GB", "256GB", "28990000", 8, "bt21");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP20", "iPhone 15 Pro Max 256GB", "TH01",
                    "BT22", "256GB - Natural Titanium", "Natural Titanium", "8GB", "256GB", "25990000", 6, "bt22");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP21", "Samsung Galaxy Z Fold7 512GB", "TH02",
                    "BT23", "12GB/512GB - Jet Black", "Jet Black", "12GB", "512GB", "46990000", 4, "bt23");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP22", "Samsung Galaxy S25 Edge 256GB", "TH02",
                    "BT24", "12GB/256GB - Titanium Silver", "Titanium Silver", "12GB", "256GB", "27990000", 7, "bt24");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP23", "Samsung Galaxy A36 5G 256GB", "TH02",
                    "BT25", "8GB/256GB - Awesome Lavender", "Awesome Lavender", "8GB", "256GB", "8990000", 12, "bt25");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP24", "Samsung Galaxy A26 5G 128GB", "TH02",
                    "BT26", "6GB/128GB - Black", "Black", "6GB", "128GB", "6490000", 15, "bt26");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP25", "Samsung Galaxy A16 5G 128GB", "TH02",
                    "BT27", "8GB/128GB - Light Green", "Light Green", "8GB", "128GB", "4990000", 18, "bt27");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP26", "Xiaomi 15 Ultra 512GB", "TH03",
                    "BT28", "16GB/512GB - Silver Chrome", "Silver Chrome", "16GB", "512GB", "34990000", 5, "bt28");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP27", "Xiaomi 14T Pro 512GB", "TH03",
                    "BT29", "12GB/512GB - Titan Gray", "Titan Gray", "12GB", "512GB", "16990000", 10, "bt29");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP28", "Xiaomi Redmi Note 14 Pro 5G 256GB", "TH03",
                    "BT30", "8GB/256GB - Midnight Black", "Midnight Black", "8GB", "256GB", "8990000", 14, "bt30");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP29", "OPPO Find X8 Pro 512GB", "TH04",
                    "BT31", "16GB/512GB - Space Black", "Space Black", "16GB", "512GB", "29990000", 5, "bt31");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP30", "OPPO A5 Pro 5G 256GB", "TH04",
                    "BT32", "8GB/256GB - Mocha Brown", "Mocha Brown", "8GB", "256GB", "7990000", 13, "bt32");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP31", "Vivo X200 Pro 512GB", "TH05",
                    "BT33", "16GB/512GB - Titanium Gray", "Titanium Gray", "16GB", "512GB", "29990000", 4, "bt33");
            seedProduct(productRepository, variantRepository, brandRepository, supplier,
                    phoneCategory, "SP32", "Vivo Y39 5G 256GB", "TH05",
                    "BT34", "8GB/256GB - Ocean Blue", "Ocean Blue", "8GB", "256GB", "6990000", 11, "bt34");
            // Replace legacy random seed images for the catalog products.
            for (String code : new String[]{"BT01", "BT02", "BT03", "BT04", "BT05", "BT06", "BT07", "BT08", "BT09", "BT10", "BT11", "BT12", "BT13", "BT14", "BT15", "BT16", "BT17", "BT18", "BT19", "BT20", "BT21", "BT22", "BT23", "BT24", "BT25", "BT26", "BT27", "BT28", "BT29", "BT30", "BT31", "BT32", "BT33", "BT34"}) {
                variantRepository.findById(code).ifPresent(variant -> {
                    String image = switch (variant.getProduct().getCode()) {
                        case "SP01" -> "/images/iphone-17-pro-max.png";
                        case "SP02" -> "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=800&auto=format&fit=crop";
                        case "SP03" -> "https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=800&auto=format&fit=crop";
                        case "SP04" -> "https://welectronics.com/images/stories/virtuemart/product/SamsungGalaxyS25Ultrasilver71.jpg";
                        case "SP05" -> "https://images.samsung.com/sec/smartphones/galaxy-z-flip6/images/galaxy-z-flip6-features-colors-silver-tb.jpg";
                        case "SP06" -> "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=90&w=1200&auto=format&fit=crop";
                        case "SP07" -> "https://www.istudiosg.com/cdn/shop/files/IMG-18064773_m_jpeg_1_eca337ea-ba30-4f9c-81c8-c6b4bbda5b05.jpg?v=1757450028&width=1445";
                        case "SP08" -> "https://bizweb.dktcdn.net/100/398/567/products/iphone-16-pro-max-tu-nhien-1.png?v=1727218057233";
                        case "SP09" -> "https://onewaymobile.vn/upload/1Samsung/S25%20Plus/5.png";
                        case "SP10" -> "https://www.pbtech.co.nz/imgprod/M/P/MPHSAM0072112.jpg?h=38284356";
                        case "SP11" -> "https://www.softbank.jp/online-shop/set/data/special/products/lineup/samsung-galaxy/img/shared/samsung-galaxy-z-flip7.png";
                        case "SP12" -> "/images/xiaomi-15.png";
                        case "SP13" -> "https://media.power-cdn.net/images/h-6b4126192109d752c13f0cc3a0b6552b/products/3824950/3824950_10_1200x1200_w_g.jpg";
                        case "SP14" -> "https://img14.360buyimg.com/pop/jfs/t1/148405/3/45632/50141/673706afFc2332df2/911a1028a4c95f56.jpg";
                        case "SP15" -> "https://imagenes.20minutos.es/files/image_640_auto/uploads/imagenes/2025/03/18/vivo-v50-satin-black-combo-low.png";
                        case "SP16" -> "https://images.price.tools/images/samsung-galaxy-a56-5g-2025-256gb-l-hlv4HTqs.jpg";
                        case "SP17" -> "/images/iphone-17-pro-max.png";
                        case "SP18" -> "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=90&w=1200&auto=format&fit=crop";
                        case "SP19" -> "https://cdn.cimri.io/image/1000x1000/apple-iphone-16-pro-256gb_917069182.jpg";
                        case "SP20" -> "https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=90&w=1200&auto=format&fit=crop";
                        case "SP21" -> "https://www.au.com/content/dam/au-com/common/graph/app/galaxy_z_fold7/galaxy_z_fold7_jetblack_01_28a35caa5ea2b3f0.jpg";
                        case "SP22" -> "https://onewaymobile.vn/upload/1Samsung/S25%20Plus/5.png";
                        case "SP23", "SP24", "SP25" -> "https://images.price.tools/images/samsung-galaxy-a56-5g-2025-256gb-l-hlv4HTqs.jpg";
                        case "SP26" -> "https://cdnpro.eraspace.com/media/catalog/product/x/i/xiaomi_15_ultra_silver_chrome_01.jpg";
                        case "SP27" -> "https://media.ldlc.com/r1600/ld/products/00/06/21/88/LD0006218872.jpg";
                        case "SP28" -> "https://boutique.orange.fr/commun/img/mobiles/xl/xiaomi-redmi-note-14-pro-5g-noir.png";
                        case "SP29" -> "https://cdn.beebom.com/mobile/oppo-find-x8-pro/oppo-find-x8-pro-black.png";
                        case "SP30" -> "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=90&w=1200&auto=format&fit=crop";
                        case "SP31" -> "https://imagenes.20minutos.es/files/image_640_auto/uploads/imagenes/2025/03/18/vivo-v50-satin-black-combo-low.png";
                        case "SP32" -> "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=90&w=1200&auto=format&fit=crop";
                        default -> "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop";
                    };
                    if (variant.getImageUrl() == null || variant.getImageUrl().isBlank()
                            || variant.getImageUrl().contains("picsum.photos")
                            || variant.getImageUrl().contains("images.unsplash.com")
                            || variant.getImageUrl().contains("teknikproffset.no")
                            || variant.getImageUrl().contains("cdn.x-kom.pl")
                            || variant.getImageUrl().contains("images.ctfassets.net")
                            || ((variant.getProduct().getCode().equals("SP01") || variant.getProduct().getCode().equals("SP17"))
                                    && variant.getImageUrl().contains("lmt-web.mstatic.lv"))
                            || (variant.getProduct().getCode().equals("SP12")
                                    && variant.getImageUrl().contains("media.ldlc.com"))) {
                        variant.setImageUrl(image);
                        variantRepository.save(variant);
                    }
                });
            }
        };
    }

    private void seedBrand(BrandRepository brandRepository, String code, String name) {
        if (!brandRepository.existsById(code)) {
            Brand brand = new Brand();
            brand.setCode(code);
            brand.setName(name);
            brandRepository.save(brand);
        }
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
        variant.setStockQuantity(stock);
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
