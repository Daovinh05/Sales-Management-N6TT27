package com.salemanagement.service.impl;

import com.salemanagement.dto.request.ReviewRequest;
import com.salemanagement.dto.response.ReviewResponse;
import com.salemanagement.entity.Review;
import com.salemanagement.repository.ReviewRepository;
import com.salemanagement.service.ReviewService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> list() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ReviewResponse create(ReviewRequest request) {
        Review review = new Review();
        apply(review, request);
        return toResponse(reviewRepository.save(review));
    }

    @Override
    public ReviewResponse update(Long id, ReviewRequest request) {
        Review review = findReview(id);
        apply(review, request);
        return toResponse(reviewRepository.save(review));
    }

    @Override
    public void delete(Long id) {
        reviewRepository.delete(findReview(id));
    }

    private Review findReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đánh giá"));
    }

    private void apply(Review review, ReviewRequest request) {
        review.setCustomerName(request.customerName().trim());
        review.setProductName(request.productName().trim());
        review.setRating(request.rating());
        review.setContent(request.content().trim());
        review.setReply(request.reply() == null || request.reply().isBlank() ? null : request.reply().trim());
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                "DG" + String.format("%02d", review.getId()),
                review.getCustomerName(),
                review.getProductName(),
                review.getRating(),
                review.getContent(),
                review.getReply(),
                review.getCreatedAt());
    }
}
