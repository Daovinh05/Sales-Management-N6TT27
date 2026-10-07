package com.salemanagement.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    public static final String STATUS_PENDING = "CHO_DUYET";
    public static final String STATUS_CONFIRMED = "DA_XAC_NHAN";
    public static final String STATUS_SHIPPING = "DANG_GIAO";
    public static final String STATUS_COMPLETED = "HOAN_THANH";
    public static final String STATUS_CANCELLED = "DA_HUY";

    @Id
    @Column(length = 20)
    private String code;

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(length = 30)
    private String customerPhone;

    @Column(length = 100)
    private String email;

    @Column(length = 255)
    private String shippingAddress;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal paymentAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 30)
    private String status = STATUS_PENDING;

    @Column(length = 30)
    private String paymentMethod;

    @Column(length = 100)
    private String username;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderDetail> details = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void setCreatedAt() {
        createdAt = LocalDateTime.now();
    }
}
