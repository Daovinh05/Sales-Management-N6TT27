package com.salemanagement.service;

import com.salemanagement.dto.response.RevenuePointResponse;
import com.salemanagement.dto.response.StatsOverviewResponse;
import com.salemanagement.dto.response.StatusCountResponse;
import com.salemanagement.dto.response.TopProductResponse;
import java.time.LocalDate;
import java.util.List;

public interface StatsService {

    StatsOverviewResponse overview(LocalDate from, LocalDate to);

    List<RevenuePointResponse> revenueByDay(LocalDate from, LocalDate to);

    List<StatusCountResponse> ordersByStatus(LocalDate from, LocalDate to);

    List<TopProductResponse> topProducts(LocalDate from, LocalDate to, int limit);
}
