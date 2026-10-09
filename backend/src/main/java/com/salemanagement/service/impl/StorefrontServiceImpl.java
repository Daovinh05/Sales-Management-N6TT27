package com.salemanagement.service.impl;

import com.salemanagement.dto.request.ReviewCreateRequest;
import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.dto.response.ProductVariantResponse;
import com.salemanagement.dto.response.StorefrontDetailResponse;
import com.salemanagement.dto.response.StorefrontProductResponse;
import com.salemanagement.dto.response.StorefrontReviewResponse;
import com.salemanagement.dto.response.StorefrontReviewsResponse;
import com.salemanagement.dto.response.SuggestionResponse;
import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Review;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.ReviewRepository;
import com.salemanagement.service.StorefrontService;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StorefrontServiceImpl implements StorefrontService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ReviewRepository reviewRepository;
    private final com.salemanagement.repository.InventoryRepository inventoryRepository;

    private static String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    /** Ngưỡng giá giữ nguyên 5 mốc của PHP (đơn vị đồng). */
    private static BigDecimal[] priceBounds(String priceRange) {
        return switch (normalize(priceRange)) {
            case "duoi-2-trieu" -> new BigDecimal[]{null, new BigDecimal("2000000")};
            case "2-4-trieu" -> new BigDecimal[]{new BigDecimal("2000000"), new BigDecimal("4000000")};
            case "4-7-trieu" -> new BigDecimal[]{new BigDecimal("4000000"), new BigDecimal("7000000")};
            case "7-13-trieu" -> new BigDecimal[]{new BigDecimal("7000000"), new BigDecimal("13000000")};
            case "tren-13-trieu" -> new BigDecimal[]{new BigDecimal("13000000"), null};
            default -> new BigDecimal[]{null, null};
        };
    }

    private StorefrontProductResponse toCard(Product product) {
        ProductVariant first = variantRepository.findFirstByProductOrderByCodeAsc(product).orElse(null);
        List<Object[]> rows = variantRepository.findPriceBounds(product.getCode());
        Object[] bounds = rows == null || rows.isEmpty() ? null : rows.get(0);
        BigDecimal minPrice = bounds != null && bounds.length > 0 ? (BigDecimal) bounds[0] : null;
        BigDecimal maxPrice = bounds != null && bounds.length > 1 ? (BigDecimal) bounds[1] : null;
        Category category = product.getCategory();
        Brand brand = product.getBrand();
        int quantity = first == null ? 0 : inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, first.getCode())
                .map(inv -> Math.max(0, inv.getQuantity() - inv.getReservedQuantity())).orElse(0);
        return StorefrontProductResponse.of(
                product.getCode(),
                product.getName(),
                first == null ? null : first.getImageUrl(),
                first == null ? null : first.getPrice(),
                minPrice,
                maxPrice,
                quantity,
                brand == null ? null : brand.getName(),
                category == null ? null : category.getName());
    }

    private ProductVariantResponse toVariant(ProductVariant variant) {
        Product product = variant.getProduct();
        int stockQty = 0;
        int reservedQty = 0;
        var inventoryOpt = inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, variant.getCode());
        if (inventoryOpt.isPresent()) {
            stockQty = inventoryOpt.get().getQuantity();
            reservedQty = inventoryOpt.get().getReservedQuantity();
        }
        return ProductVariantResponse.of(
                variant.getCode(),
                product == null ? null : product.getCode(),
                product == null ? null : product.getName(),
                variant.getName(),
                variant.getImageUrl(),
                variant.getColor(),
                variant.getRam(),
                variant.getStorage(),
                variant.getPrice(),
                stockQty,
                reservedQty,
                variant.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StorefrontProductResponse> listProducts(String categoryCode, String brandCode,
                                                                String priceRange, String search,
                                                                int page, int size) {
        BigDecimal[] bounds = priceBounds(priceRange);
        Page<Product> result = productRepository.storefront(
                normalize(categoryCode), normalize(brandCode), normalize(search),
                bounds[0], bounds[1], PageRequest.of(Math.max(0, page), Math.max(1, Math.min(48, size))));
        List<StorefrontProductResponse> content = result.getContent().stream()
                .map(this::toCard)
                .toList();
        return PageResponse.of(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    @Override
    @Transactional(readOnly = true)
    public StorefrontDetailResponse getDetail(String code) {
        Product product = requireProduct(code);
        Category category = product.getCategory();
        Brand brand = product.getBrand();
        List<ProductVariantResponse> variants = variantRepository.findByProduct(product).stream()
                .map(this::toVariant)
                .toList();
        List<Product> similar = category == null
                ? productRepository.findTop4ByCodeNotOrderByCreatedAtDesc(product.getCode())
                : productRepository.findTop4ByCategory_CodeAndCodeNotOrderByCreatedAtDesc(
                        category.getCode(), product.getCode());
        return StorefrontDetailResponse.of(
                product.getCode(),
                product.getName(),
                category == null ? null : category.getCode(),
                category == null ? null : category.getName(),
                brand == null ? null : brand.getCode(),
                brand == null ? null : brand.getName(),
                product.getSupplier() == null ? null : product.getSupplier().getCode(),
                product.getSupplier() == null ? null : product.getSupplier().getName(),
                variants,
                similar.stream().map(this::toCard).toList());
    }

    private Product requireProduct(String code) {
        String normalized = normalize(code).toUpperCase();
        return productRepository.findById(normalized)
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy sản phẩm có mã: " + code, HttpStatus.NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public StorefrontReviewsResponse getReviews(String code) {
        Product product = requireProduct(code);
        List<Review> reviews = reviewRepository.findByProductNameOrderByCreatedAtDesc(product.getName());
        long total = reviews.size();
        double average = total == 0 ? 0
                : Math.round(reviews.stream().mapToInt(Review::getRating).average().orElse(0) * 100) / 100.0;
        List<StorefrontReviewsResponse.StarBucket> distribution = new java.util.ArrayList<>();
        for (int stars = 5; stars >= 1; stars--) {
            final int level = stars;
            long count = reviews.stream().filter(r -> r.getRating() == level).count();
            double percent = total == 0 ? 0 : Math.round(count * 1000.0 / total) / 10.0;
            distribution.add(StorefrontReviewsResponse.StarBucket.of(stars, count, percent));
        }
        List<StorefrontReviewResponse> items = reviews.stream()
                .map(r -> StorefrontReviewResponse.of(r.getId(), r.getCustomerName(), r.getRating(),
                        r.getContent(), r.getReply(), r.getCreatedAt()))
                .toList();
        return StorefrontReviewsResponse.of(average, total, distribution, items);
    }

    @Override
    @Transactional
    public StorefrontReviewResponse createReview(String code, String customerName, ReviewCreateRequest request) {
        Product product = requireProduct(code);
        Review review = new Review();
        review.setCustomerName(customerName);
        review.setProductName(product.getName());
        review.setRating(request.getRating());
        review.setContent(request.getContent().trim());
        Review saved = reviewRepository.save(review);
        return StorefrontReviewResponse.of(saved.getId(), saved.getCustomerName(), saved.getRating(),
                saved.getContent(), saved.getReply(), saved.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StorefrontProductResponse> random(int limit) {
        return productRepository.findRandom(PageRequest.of(0, Math.max(1, Math.min(20, limit)))).stream()
                .map(this::toCard)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SuggestionResponse> suggest(String query, int limit) {
        String keyword = normalize(query);
        if (keyword.isEmpty()) {
            return List.of();
        }
        return productRepository.search("", keyword).stream()
                .limit(Math.max(1, Math.min(20, limit)))
                .map(product -> {
                    String image = variantRepository.findFirstByProductOrderByCodeAsc(product)
                            .map(ProductVariant::getImageUrl).orElse(null);
                    return SuggestionResponse.of(product.getCode(), product.getName(), image);
                })
                .toList();
    }
}
