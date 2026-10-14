package com.salemanagement.service;

import com.salemanagement.dto.request.ReviewRequest;
import com.salemanagement.dto.response.ReviewResponse;
import java.util.List;

public interface ReviewService {
    List<ReviewResponse> list();

    ReviewResponse create(ReviewRequest request);

    ReviewResponse update(Long id, ReviewRequest request);

    void delete(Long id);
}
