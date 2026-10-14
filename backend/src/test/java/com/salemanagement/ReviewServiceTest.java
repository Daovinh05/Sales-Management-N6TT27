package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.request.ReviewRequest;
import com.salemanagement.dto.response.ReviewResponse;
import com.salemanagement.entity.Review;
import com.salemanagement.repository.ReviewRepository;
import com.salemanagement.service.impl.ReviewServiceImpl;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    private ReviewServiceImpl reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewServiceImpl(reviewRepository);
        lenient().when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Review review(Long id, String customer, String product) {
        Review review = new Review();
        review.setId(id);
        review.setCustomerName(customer);
        review.setProductName(product);
        review.setRating(5);
        review.setContent("Sản phẩm tốt");
        return review;
    }

    private ReviewRequest request(String customer, String product, Integer rating, String content, String reply) {
        return new ReviewRequest(customer, product, rating, content, reply);
    }

    @Test
    void list_sapMoiNhatTruoc_vaMaDG() {
        Review older = review(1L, "An", "iPhone");
        Review newer = review(2L, "Bình", "iPhone");
        when(reviewRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(newer, older));

        List<ReviewResponse> result = reviewService.list();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(2L);
        assertThat(result.get(0).code()).isEqualTo("DG02");
        assertThat(result.get(1).code()).isEqualTo("DG01");
    }

    @Test
    void create_chuanHoaTrim_vaReplyRongThanhNull() {
        ReviewResponse response = reviewService.create(request("  An  ", "  iPhone  ", 5, "  Tốt  ", "   "));

        assertThat(response.customerName()).isEqualTo("An");
        assertThat(response.productName()).isEqualTo("iPhone");
        assertThat(response.content()).isEqualTo("Tốt");
        assertThat(response.reply()).isNull();
    }

    @Test
    void update_banGhiTonTai_luuGiaTriMoi() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review(1L, "An", "iPhone")));

        ReviewResponse response = reviewService.update(1L, request("An", "Samsung", 4, "Ổn", "Cảm ơn"));

        assertThat(response.productName()).isEqualTo("Samsung");
        assertThat(response.rating()).isEqualTo(4);
        assertThat(response.reply()).isEqualTo("Cảm ơn");
    }

    @Test
    void update_idKhongTonTai_bao404TiengViet() {
        when(reviewRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.update(999L, request("An", "iPhone", 5, "Tốt", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Không tìm thấy đánh giá");
    }

    @Test
    void delete_goiRepositoryVoiBanGhiTonTai() {
        Review existing = review(1L, "An", "iPhone");
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(existing));

        reviewService.delete(1L);

        verify(reviewRepository).delete(existing);
    }

    @Test
    void delete_idKhongTonTai_bao404() {
        when(reviewRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.delete(999L))
                .isInstanceOf(ResponseStatusException.class);
    }
}
