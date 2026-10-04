package com.salemanagement.service;

import com.salemanagement.dto.request.ReviewCreateRequest;
import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.dto.response.StorefrontDetailResponse;
import com.salemanagement.dto.response.StorefrontProductResponse;
import com.salemanagement.dto.response.StorefrontReviewResponse;
import com.salemanagement.dto.response.StorefrontReviewsResponse;
import com.salemanagement.dto.response.SuggestionResponse;
import java.util.List;

public interface StorefrontService {
    PageResponse<StorefrontProductResponse> listProducts(String categoryCode, String brandCode,
                                                         String priceRange, String search,
                                                         int page, int size);

    StorefrontDetailResponse getDetail(String code);

    List<SuggestionResponse> suggest(String query, int limit);

    List<StorefrontProductResponse> random(int limit);

    StorefrontReviewsResponse getReviews(String code);

    StorefrontReviewResponse createReview(String code, String customerName, ReviewCreateRequest request);
}
