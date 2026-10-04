package com.salemanagement.service.impl;

import com.salemanagement.dto.request.ProductRequest;
import com.salemanagement.dto.request.ProductUpdateRequest;
import com.salemanagement.dto.response.ImportResult;
import com.salemanagement.dto.response.ImportResult.RowError;
import com.salemanagement.dto.response.ProductResponse;
import com.salemanagement.entity.Brand;
import com.salemanagement.entity.Category;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Supplier;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.repository.CartItemRepository;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.SupplierRepository;
import com.salemanagement.service.ProductService;
import com.salemanagement.util.ExcelHelper.ParsedProductRow;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final SupplierRepository supplierRepository;
    private final CartItemRepository cartItemRepository;

    private static String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }

    private Category resolveCategory(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalized = normalizeCode(code);
        return categoryRepository.findById(normalized)
                .orElseThrow(() -> new BusinessException(
                        "Danh mục không tồn tại: " + code.trim(), HttpStatus.UNPROCESSABLE_ENTITY));
    }

    private Brand resolveBrand(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalized = normalizeCode(code);
        return brandRepository.findById(normalized)
                .orElseThrow(() -> new BusinessException(
                        "Thương hiệu không tồn tại: " + code.trim(), HttpStatus.UNPROCESSABLE_ENTITY));
    }

    private Supplier resolveSupplier(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalized = normalizeCode(code);
        return supplierRepository.findById(normalized)
                .orElseThrow(() -> new BusinessException(
                        "Nhà cung cấp không tồn tại: " + code.trim(), HttpStatus.UNPROCESSABLE_ENTITY));
    }

    private ProductResponse toResponse(Product product) {
        Category category = product.getCategory();
        Brand brand = product.getBrand();
        Supplier supplier = product.getSupplier();
        ProductVariant firstVariant = variantRepository.findFirstByProductOrderByCodeAsc(product).orElse(null);
        return ProductResponse.of(
                product.getCode(),
                product.getName(),
                category == null ? null : category.getCode(),
                category == null ? null : category.getName(),
                brand == null ? null : brand.getCode(),
                brand == null ? null : brand.getName(),
                supplier == null ? null : supplier.getCode(),
                supplier == null ? null : supplier.getName(),
                firstVariant == null ? null : firstVariant.getName(),
                firstVariant == null ? null : firstVariant.getImageUrl(),
                firstVariant == null ? null : firstVariant.getPrice(),
                firstVariant == null ? null : firstVariant.getStockQuantity(),
                product.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> list(String code, String name) {
        return productRepository.search(code, name).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getDetail(String code) {
        Product product = productRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy sản phẩm có mã: " + code, HttpStatus.NOT_FOUND));
        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        String code = normalizeCode(request.getCode());
        if (productRepository.existsById(code)) {
            throw new BusinessException("Mã sản phẩm đã tồn tại", HttpStatus.CONFLICT);
        }
        Product product = new Product();
        product.setCode(code);
        product.setName(request.getName().trim());
        product.setCategory(resolveCategory(request.getCategoryCode()));
        product.setBrand(resolveBrand(request.getBrandCode()));
        product.setSupplier(resolveSupplier(request.getSupplierCode()));
        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public ProductResponse update(String code, ProductUpdateRequest request) {
        Product product = productRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy sản phẩm có mã: " + code, HttpStatus.NOT_FOUND));
        product.setName(request.getName().trim());
        product.setCategory(resolveCategory(request.getCategoryCode()));
        product.setBrand(resolveBrand(request.getBrandCode()));
        product.setSupplier(resolveSupplier(request.getSupplierCode()));
        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void delete(String code) {
        Product product = productRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy sản phẩm có mã: " + code, HttpStatus.NOT_FOUND));
        // Port đúng PHP SanPham_delete: xóa biến thể liên quan trước rồi mới xóa sản phẩm.
        // (Khi có module đơn hàng sẽ bổ sung chặn 409 nếu biến thể đã phát sinh chi tiết đơn.)
        // Dọn dòng giỏ hàng đang giữ các biến thể để tránh kẹt khóa ngoại.
        variantRepository.findByProduct(product).forEach(variant -> {
            cartItemRepository.deleteByVariant(variant);
            variantRepository.delete(variant);
        });
        productRepository.delete(product);
    }

    @Override
    @Transactional
    public ImportResult importRows(List<ParsedProductRow> rows) {
        int created = 0;
        int skippedEmpty = 0;
        List<String> duplicatedCodes = new ArrayList<>();
        List<RowError> failedRows = new ArrayList<>();

        for (ParsedProductRow parsed : rows) {
            ProductRequest request = parsed.request();
            String code = request.getCode() == null ? "" : request.getCode().trim();
            if (code.isEmpty()) {
                skippedEmpty++;
                continue;
            }
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                failedRows.add(RowError.of(parsed.rowNumber(), code, "Thiếu tên sản phẩm (cột B)"));
                continue;
            }
            if (productRepository.existsById(normalizeCode(code))) {
                duplicatedCodes.add(code);
                continue;
            }
            try {
                create(request);
                created++;
            } catch (BusinessException ex) {
                failedRows.add(RowError.of(parsed.rowNumber(), code, ex.getMessage()));
            }
        }
        return ImportResult.of(created, skippedEmpty, duplicatedCodes.size(), duplicatedCodes,
                failedRows.size(), failedRows);
    }
}
