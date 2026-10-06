package com.salemanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import com.salemanagement.enums.ERole;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 50)
    private ERole name; // ROLE_ADMIN, ROLE_CUSTOMER, ROLE_WAREHOUSE_STAFF

    @Column(length = 255)
    private String description;
}
