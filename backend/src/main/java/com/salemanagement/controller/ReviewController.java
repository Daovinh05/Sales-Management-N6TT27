package com.salemanagement.controller;

import com.salemanagement.entity.Review;
import com.salemanagement.repository.ReviewRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReviewController {

    private final ReviewRepository reviewRepository;

    @GetMapping
    public List<ReviewResponse> list() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@Valid @RequestBody ReviewRequest request) {
        Review review = new Review();
        apply(review, request);
        return toResponse(reviewRepository.save(review));
    }

    @PutMapping("/{id}")
    public ReviewResponse update(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        Review review = findReview(id);
        apply(review, request);
        return toResponse(reviewRepository.save(review));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
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

    public record ReviewRequest(
            @NotBlank @Size(max = 100) String customerName,
            @NotBlank @Size(max = 150) String productName,
            @Min(1) @Max(5) Integer rating,
            @NotBlank @Size(max = 2000) String content,
            @Size(max = 2000) String reply) {}

    public record ReviewResponse(
            Long id,
            String code,
            String customerName,
            String productName,
            Integer rating,
            String content,
            String reply,
            LocalDateTime createdAt) {}
}