package com.salemanagement.config;

import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Role;
import com.salemanagement.entity.Supplier;
import com.salemanagement.entity.User;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CategoryRepository;
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
                    variantRepository.save(variant);
                }
            }
        };
    }
}
