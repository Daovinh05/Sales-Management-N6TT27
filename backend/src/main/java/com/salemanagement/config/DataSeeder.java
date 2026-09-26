package com.salemanagement.config;

import com.salemanagement.entity.Role;
import com.salemanagement.entity.User;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

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
            roleRepository.findByName("ROLE_CUSTOMER")
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
        };
    }
}
