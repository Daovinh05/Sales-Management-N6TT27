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
    private final com.salemanagement.repository.InventoryRepository inventoryRepository;
    private final com.salemanagement.repository.ImportDetailRepository importDetailRepository;
    private final com.salemanagement.repository.OrderRepository orderRepository;

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
        int quantity = firstVariant == null ? 0 : inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, firstVariant.getCode())
                .map(inv -> Math.max(0, inv.getQuantity() - inv.getReservedQuantity())).orElse(0);
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
                quantity,
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
        // Chặn trước khi xóa biến thể nào: còn tồn kho hoặc đã phát sinh nhập/đơn thì dừng cả product.
        // Dọn dòng giỏ hàng đang giữ các biến thể để tránh kẹt khóa ngoại.
        List<ProductVariant> variants = variantRepository.findByProduct(product);
        variants.forEach(this::ensureVariantDeletable);
        variants.forEach(variant -> {
            cartItemRepository.deleteByVariant(variant);
            variantRepository.delete(variant);
        });
        productRepository.delete(product);
    }

    /** Giống ProductVariantServiceImpl.ensureDeletable: chặn xóa khi còn tồn hoặc đã phát sinh giao dịch. */
    private void ensureVariantDeletable(ProductVariant variant) {
        boolean hasStock = inventoryRepository
                .findByWarehouseIdAndProductVariant_Code(1L, variant.getCode())
                .map(inv -> (inv.getQuantity() != null && inv.getQuantity() > 0)
                        || (inv.getReservedQuantity() != null && inv.getReservedQuantity() > 0))
                .orElse(false);
        if (hasStock) {
            throw new BusinessException(
                    "Biến thể " + variant.getCode() + " còn tồn kho, không thể xóa sản phẩm",
                    HttpStatus.CONFLICT);
        }
        if (importDetailRepository.existsByProductVariant_Code(variant.getCode())) {
            throw new BusinessException(
                    "Biến thể " + variant.getCode() + " đã phát sinh phiếu nhập, không thể xóa sản phẩm",
                    HttpStatus.CONFLICT);
        }
        if (orderRepository.countByDetailsVariantCode(variant.getCode()) > 0) {
            throw new BusinessException(
                    "Biến thể " + variant.getCode() + " đã phát sinh đơn hàng, không thể xóa sản phẩm",
                    HttpStatus.CONFLICT);
        }
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
