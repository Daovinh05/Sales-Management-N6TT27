package com.salemanagement.service;

import com.salemanagement.dto.request.PromotionRequest;
import com.salemanagement.dto.response.PromotionResponse;
import java.util.List;

public interface PromotionService {

    List<PromotionResponse> list();

    PromotionResponse create(PromotionRequest request);

    PromotionResponse update(String code, PromotionRequest request);

    void delete(String code);
}