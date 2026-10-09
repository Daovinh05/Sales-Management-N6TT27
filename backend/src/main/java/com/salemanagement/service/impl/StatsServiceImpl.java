package com.salemanagement.service.impl;

import com.salemanagement.dto.response.RevenuePointResponse;
import com.salemanagement.dto.response.StatsOverviewResponse;
import com.salemanagement.dto.response.StatusCountResponse;
import com.salemanagement.dto.response.TopProductResponse;
import com.salemanagement.entity.Order;
import com.salemanagement.repository.OrderDetailRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.service.StatsService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;

    private static LocalDateTime startOf(LocalDate date) {
        return date.atStartOfDay();
    }

    private static LocalDateTime endOf(LocalDate date) {
        return date.atTime(LocalTime.MAX);
    }

    @Override
    @Transactional(readOnly = true)
    public StatsOverviewResponse overview(LocalDate from, LocalDate to) {
        BigDecimal revenue = BigDecimal.ZERO;
        long completed = 0;
        long total = 0;
        long cancelled = 0;
        for (RevenuePointResponse point : revenueByDay(from, to)) {
            revenue = revenue.add(point.revenue());
            completed += point.orders();
        }
        for (StatusCountResponse row : ordersByStatus(from, to)) {
            total += row.count();
            if (Order.STATUS_CANCELLED.equals(row.status())) {
                cancelled = row.count();
            }
        }
        return new StatsOverviewResponse(revenue, completed, total, cancelled);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RevenuePointResponse> revenueByDay(LocalDate from, LocalDate to) {
        LocalDateTime start = startOf(from);
        LocalDateTime end = endOf(to);
        Map<String, RevenuePointResponse> points = new LinkedHashMap<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            points.put(day.toString(), new RevenuePointResponse(day.toString(), BigDecimal.ZERO, 0));
        }
        for (Object[] row : orderRepository.revenueByDay(Order.STATUS_COMPLETED, start, end)) {
            String date = String.valueOf(row[0]);
            BigDecimal revenue = row[1] == null ? BigDecimal.ZERO : (BigDecimal) row[1];
            long orders = row[2] == null ? 0 : ((Number) row[2]).longValue();
            points.put(date, new RevenuePointResponse(date, revenue, orders));
        }
        return new ArrayList<>(points.values());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StatusCountResponse> ordersByStatus(LocalDate from, LocalDate to) {
        List<StatusCountResponse> result = new ArrayList<>();
        for (Object[] row : orderRepository.countByStatusBetween(startOf(from), endOf(to))) {
            result.add(new StatusCountResponse(String.valueOf(row[0]), ((Number) row[1]).longValue()));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopProductResponse> topProducts(LocalDate from, LocalDate to, int limit) {
        List<TopProductResponse> result = new ArrayList<>();
        for (Object[] row : orderDetailRepository.topSelling(Order.STATUS_COMPLETED,
                startOf(from), endOf(to))) {
            if (result.size() >= Math.max(1, limit)) {
                break;
            }
            String variantCode = (String) row[0];
            String productName = (String) row[1];
            BigDecimal unitPrice = row[2] == null ? BigDecimal.ZERO : (BigDecimal) row[2];
            long quantity = row[3] == null ? 0 : ((Number) row[3]).longValue();
            result.add(new TopProductResponse(variantCode, productName, quantity,
                    unitPrice.multiply(BigDecimal.valueOf(quantity))));
        }
        return result;
    }
}
