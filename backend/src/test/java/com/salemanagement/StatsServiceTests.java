package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.response.StatsOverviewResponse;
import com.salemanagement.dto.response.TopProductResponse;
import com.salemanagement.entity.Order;
import com.salemanagement.repository.OrderDetailRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.service.impl.StatsServiceImpl;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StatsServiceTests {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderDetailRepository orderDetailRepository;

    private StatsServiceImpl statsService;
    private final LocalDate from = LocalDate.of(2026, 10, 1);
    private final LocalDate to = LocalDate.of(2026, 10, 9);

    @BeforeEach
    void setUp() {
        statsService = new StatsServiceImpl(orderRepository, orderDetailRepository);
    }

    @Test
    void overview_chiTinhDoanhThuDonHoanThanh() {
        when(orderRepository.revenueByDay(any(), any(), any())).thenReturn(List.of(
                new Object[]{Date.valueOf("2026-10-08"), new BigDecimal("100"), 2L},
                new Object[]{Date.valueOf("2026-10-09"), new BigDecimal("50"), 1L}));
        when(orderRepository.countByStatusBetween(any(), any())).thenReturn(List.of(
                new Object[]{Order.STATUS_PENDING, 3L},
                new Object[]{Order.STATUS_COMPLETED, 2L},
                new Object[]{Order.STATUS_CANCELLED, 1L}));

        StatsOverviewResponse overview = statsService.overview(from, to);

        assertThat(overview.revenue()).isEqualByComparingTo(new BigDecimal("150"));
        assertThat(overview.completedOrders()).isEqualTo(3);
        assertThat(overview.totalOrders()).isEqualTo(6);
        assertThat(overview.cancelledOrders()).isEqualTo(1);
    }

    @Test
    void topProducts_xepTheoSoLuongGioiHanLimit() {
        when(orderDetailRepository.topSelling(any(), any(), any())).thenReturn(List.of(
                new Object[]{"BT01", "Iphone", new BigDecimal("1000"), 9L},
                new Object[]{"BT02", "Samsung", new BigDecimal("2000"), 5L}));

        List<TopProductResponse> top = statsService.topProducts(from, to, 1);

        assertThat(top).hasSize(1);
        assertThat(top.get(0).variantCode()).isEqualTo("BT01");
        assertThat(top.get(0).quantity()).isEqualTo(9);
        assertThat(top.get(0).revenue()).isEqualByComparingTo(new BigDecimal("9000"));
    }

    @Test
    void ordersByStatus_demDungMoiTrangThai() {
        when(orderRepository.countByStatusBetween(any(), any())).thenReturn(List.of(
                new Object[]{Order.STATUS_PENDING, 4L},
                new Object[]{Order.STATUS_SHIPPING, 2L}));

        assertThat(statsService.ordersByStatus(from, to))
                .extracting(row -> row.status() + "=" + row.count())
                .containsExactlyInAnyOrder("CHO_DUYET=4", "DANG_GIAO=2");
    }
}
