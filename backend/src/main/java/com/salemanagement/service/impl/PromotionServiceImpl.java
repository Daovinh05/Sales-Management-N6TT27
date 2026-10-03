package com.salemanagement.service.impl;

import com.salemanagement.dto.request.PromotionRequest;
import com.salemanagement.dto.response.PromotionResponse;
import com.salemanagement.entity.Promotion;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.PromotionRepository;
import com.salemanagement.service.PromotionService;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PromotionRepository promotionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> list() {
        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        return promotionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(promotion -> toResponse(promotion, now))
                .toList();
    }

    @Override
    @Transactional
    public PromotionResponse create(PromotionRequest request) {
        validatePeriod(request);
        String code = request.code().trim().toUpperCase();
        if (promotionRepository.existsById(code)) {
            throw new BusinessException("Mã khuyến mãi đã tồn tại", HttpStatus.CONFLICT);
        }

        Promotion promotion = new Promotion();
        apply(promotion, request, code);
        return toResponse(promotionRepository.save(promotion), LocalDateTime.now(BUSINESS_ZONE));
    }

    @Override
    @Transactional
    public PromotionResponse update(String code, PromotionRequest request) {
        validatePeriod(request);
        Promotion promotion = findPromotion(code);
        apply(promotion, request, promotion.getCode());
        return toResponse(promotionRepository.save(promotion), LocalDateTime.now(BUSINESS_ZONE));
    }

    @Override
    @Transactional
    public void delete(String code) {
        findPromotion(code);
        promotionRepository.deleteById(code);
    }

    private void apply(Promotion promotion, PromotionRequest request, String code) {
        promotion.setCode(code);
        promotion.setName(request.name().trim());
        promotion.setDiscountAmount(request.discountAmount());
        promotion.setStartsAt(request.startsAt());
        promotion.setEndsAt(request.endsAt());
    }

    private void validatePeriod(PromotionRequest request) {
        if (request.endsAt().isBefore(request.startsAt())) {
            throw new BusinessException("Thời gian kết thúc phải sau thời gian bắt đầu", HttpStatus.BAD_REQUEST);
        }
    }

    private PromotionResponse toResponse(Promotion promotion, LocalDateTime now) {
        String status = now.isBefore(promotion.getStartsAt())
                ? "Sắp diễn ra"
                : now.isAfter(promotion.getEndsAt()) ? "Hết khuyến mãi" : "Còn khuyến mãi";
        return PromotionResponse.from(promotion, status);
    }

    private Promotion findPromotion(String code) {
        return promotionRepository.findById(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi"));
    }
}