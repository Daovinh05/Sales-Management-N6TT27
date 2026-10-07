package com.salemanagement.service.impl;

import com.salemanagement.dto.request.ProductVariantRequest;
import com.salemanagement.dto.request.ProductVariantUpdateRequest;
import com.salemanagement.dto.response.ImportResult;
import com.salemanagement.dto.response.ImportResult.RowError;
import com.salemanagement.dto.response.ProductVariantResponse;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.CartItemRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.service.FileStorageService;
import com.salemanagement.service.ProductVariantService;
import com.salemanagement.util.ExcelHelper.ParsedVariantRow;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;
    private final CartItemRepository cartItemRepository;
    private final com.salemanagement.repository.InventoryRepository inventoryRepository;

    private static String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }

    private Product resolveProduct(String code) {
        if (code == null || code.isBlank()) {
            throw new BusinessException("Vui lòng cung cấp mã sản phẩm", HttpStatus.BAD_REQUEST);
        }
        return productRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new BusinessException(
                        "Mã sản phẩm không tồn tại: " + code.trim(), HttpStatus.UNPROCESSABLE_ENTITY));
    }

    private ProductVariantResponse toResponse(ProductVariant variant) {
        Product product = variant.getProduct();
        int quantity = inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, variant.getCode())
                .map(com.salemanagement.entity.Inventory::getQuantity).orElse(0);
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
                quantity,
                variant.getCreatedAt());
    }

    private void apply(ProductVariant variant, String name, String color, String ram,
                       String storage, BigDecimal price) {
        variant.setName(name == null || name.isBlank() ? null : name.trim());
        variant.setColor(color == null || color.isBlank() ? null : color.trim());
        variant.setRam(ram == null || ram.isBlank() ? null : ram.trim());
        variant.setStorage(storage == null || storage.isBlank() ? null : storage.trim());
        variant.setPrice(price);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> list(String code, String name) {
        return variantRepository.search(code, name).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> listByProduct(String productCode) {
        Product product = productRepository.findById(normalizeCode(productCode))
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy sản phẩm có mã: " + productCode, HttpStatus.NOT_FOUND));
        return variantRepository.findByProduct(product).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductVariantResponse getDetail(String code) {
        ProductVariant variant = variantRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy biến thể có mã: " + code, HttpStatus.NOT_FOUND));
        return toResponse(variant);
    }

    @Override
    @Transactional
    public ProductVariantResponse create(ProductVariantRequest request, MultipartFile image) {
        String code = normalizeCode(request.getCode());
        if (variantRepository.existsById(code)) {
            throw new BusinessException("Mã biến thể đã tồn tại", HttpStatus.CONFLICT);
        }
        Product product = resolveProduct(request.getProductCode());
        ProductVariant variant = new ProductVariant();
        variant.setCode(code);
        variant.setProduct(product);
        apply(variant, request.getName(), request.getColor(), request.getRam(),
                request.getStorage(), request.getPrice());
        variant.setImageUrl(fileStorageService.storeVariantImage(image));
        return toResponse(variantRepository.save(variant));
    }

    @Override
    @Transactional
    public ProductVariantResponse update(String code, ProductVariantUpdateRequest request, MultipartFile image) {
        ProductVariant variant = variantRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy biến thể có mã: " + code, HttpStatus.NOT_FOUND));
        variant.setProduct(resolveProduct(request.getProductCode()));
        apply(variant, request.getName(), request.getColor(), request.getRam(),
                request.getStorage(), request.getPrice());
        // Giữ ảnh cũ nếu không upload mới — đúng behavior PHP bienthe_sua.
        if (image != null && !image.isEmpty()) {
            String oldImage = variant.getImageUrl();
            variant.setImageUrl(fileStorageService.storeVariantImage(image));
            fileStorageService.deleteVariantImage(oldImage);
        }
        return toResponse(variantRepository.save(variant));
    }

    @Override
    @Transactional
    public void delete(String code) {
        ProductVariant variant = variantRepository.findById(normalizeCode(code))
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy biến thể có mã: " + code, HttpStatus.NOT_FOUND));
        // Port đúng PHP BienThe_delete: xóa file ảnh trước rồi xóa bản ghi.
        // Dọn dòng giỏ hàng đang giữ biến thể để tránh kẹt khóa ngoại.
        fileStorageService.deleteVariantImage(variant.getImageUrl());
        cartItemRepository.deleteByVariant(variant);
        variantRepository.delete(variant);
    }

    @Override
    @Transactional
    public ImportResult importRows(List<ParsedVariantRow> rows) {
        int created = 0;
        int skippedEmpty = 0;
        List<String> duplicatedCodes = new ArrayList<>();
        List<RowError> failedRows = new ArrayList<>();

        for (ParsedVariantRow parsed : rows) {
            ProductVariantRequest request = parsed.request();
            String code = request.getCode() == null ? "" : request.getCode().trim();
            if (code.isEmpty()) {
                skippedEmpty++;
                continue;
            }
            if (request.getProductCode() == null || request.getProductCode().trim().isEmpty()) {
                failedRows.add(RowError.of(parsed.rowNumber(), code, "Thiếu mã sản phẩm"));
                continue;
            }
            if (variantRepository.existsById(normalizeCode(code))) {
                duplicatedCodes.add(code);
                continue;
            }
            try {
                // Import Excel không kèm ảnh — đúng PHP up_l (img để trống).
                create(request, null);
                created++;
            } catch (BusinessException ex) {
                failedRows.add(RowError.of(parsed.rowNumber(), code, ex.getMessage()));
            }
        }
        return ImportResult.of(created, skippedEmpty, duplicatedCodes.size(), duplicatedCodes,
                failedRows.size(), failedRows);
    }
}
