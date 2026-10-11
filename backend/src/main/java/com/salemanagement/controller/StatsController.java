package com.salemanagement.controller;

import com.salemanagement.dto.response.RevenuePointResponse;
import com.salemanagement.dto.response.StatsOverviewResponse;
import com.salemanagement.dto.response.StatusCountResponse;
import com.salemanagement.dto.response.TopProductResponse;
import com.salemanagement.service.StatsService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StatsController {

    private final StatsService statsService;

    private static LocalDate defaultFrom(LocalDate from) {
        return from != null ? from : LocalDate.now().minusDays(29);
    }

    private static LocalDate defaultTo(LocalDate to) {
        return to != null ? to : LocalDate.now();
    }

    @GetMapping("/overview")
    public StatsOverviewResponse overview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return statsService.overview(defaultFrom(from), defaultTo(to));
    }

    @GetMapping("/revenue-by-day")
    public List<RevenuePointResponse> revenueByDay(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return statsService.revenueByDay(defaultFrom(from), defaultTo(to));
    }

    @GetMapping("/orders-by-status")
    public List<StatusCountResponse> ordersByStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return statsService.ordersByStatus(defaultFrom(from), defaultTo(to));
    }

    @GetMapping("/top-products")
    public List<TopProductResponse> topProducts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "5") int limit) {
        return statsService.topProducts(defaultFrom(from), defaultTo(to), limit);
    }
}
