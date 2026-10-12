package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.request.ProductRequest;
import com.salemanagement.dto.request.ProductUpdateRequest;
import com.salemanagement.dto.response.ProductResponse;
import com.salemanagement.dto.response.ImportResult;
import com.salemanagement.entity.*;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.util.ExcelHelper;
import com.salemanagement.repository.*;
import com.salemanagement.service.impl.ProductServiceImpl;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

/**
 * Tests for Product Service - Quản lý sản phẩm.
 * Tuân theo Constitution Principle III: Test làm bằng chứng.
 * Viết bằng tiếng Việt (Principle VI).
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceTests {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BrandRepository brandRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private com.salemanagement.repository.InventoryRepository inventoryRepository;

    @Mock
    private ImportDetailRepository importDetailRepository;

    @Mock
    private OrderRepository orderRepository;

    private ProductServiceImpl productService;

    private static String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }

    private Product product() {
        Product p = new Product();
        p.setCode("SP001");
        p.setName("Sản phẩm test");
        return p;
    }

    private Category category() {
        Category c = new Category();
        c.setCode("CAT001");
        c.setName("Điện thoại");
        return c;
    }

    private Brand brand() {
        Brand b = new Brand();
        b.setCode("BR001");
        b.setName("Apple");
        return b;
    }

    private Supplier supplier() {
        Supplier s = new Supplier();
        s.setCode("SU001");
        s.setName("Công ty A");
        return s;
    }

    @BeforeEach
    void setUp() {
        productService = new ProductServiceImpl(
                productRepository, variantRepository, categoryRepository,
                brandRepository, supplierRepository, cartItemRepository,
                inventoryRepository, importDetailRepository, orderRepository);
        // Lenient mocking cho save
        lenient().when(productRepository.save(any(Product.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        lenient().when(categoryRepository.findById("CAT001"))
                .thenReturn(Optional.of(category()));
        lenient().when(brandRepository.findById("BR001"))
                .thenReturn(Optional.of(brand()));
        lenient().when(supplierRepository.findById("SU001"))
                .thenReturn(Optional.of(supplier()));
    }

    @Test
    void list_khongTimKiem_traLayDanhSachRong() {
        when(productRepository.search(null, null)).thenReturn(List.of());
        List<ProductResponse> result = productService.list(null, null);
        assertThat(result).isEmpty();
    }

    @Test
    void list_timKiemTheoTen_traKetQua() {
        Product p = product();
        when(productRepository.search(null, "Sản phẩm test")).thenReturn(List.of(p));
        List<ProductResponse> result = productService.list(null, "Sản phẩm test");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Sản phẩm test");
    }

    @Test
    void getDetail_sanPhamTonTai_traThongTin() {
        when(productRepository.findById("SP001")).thenReturn(Optional.of(product()));
        ProductResponse result = productService.getDetail("SP001");
        assertThat(result.getCode()).isEqualTo("SP001");
        assertThat(result.getName()).isEqualTo("Sản phẩm test");
    }

    @Test
    void getDetail_sanPhamKhongTonTai_baoLoi() {
        when(productRepository.findById("SP001")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> productService.getDetail("SP001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm có mã");
    }

    @Test
    void create_sanPhamMoi_traThanhCong() {
        ProductRequest request = new ProductRequest();
        request.setCode("SP002");
        request.setName("iPhone 15");
        request.setCategoryCode("CAT001");
        request.setBrandCode("BR001");
        request.setSupplierCode("SU001");

        when(productRepository.existsById("SP002")).thenReturn(false);
        when(categoryRepository.findById("CAT001")).thenReturn(Optional.of(category()));
        when(brandRepository.findById("BR001")).thenReturn(Optional.of(brand()));
        when(supplierRepository.findById("SU001")).thenReturn(Optional.of(supplier()));

        ProductResponse result = productService.create(request);
        assertThat(result.getCode()).isEqualTo("SP002");
        assertThat(result.getName()).isEqualTo("iPhone 15");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void create_maDaTonTai_baoLoi() {
        ProductRequest request = new ProductRequest();
        request.setCode("SP001");
        request.setName("Sản phẩm trùng");

        when(productRepository.existsById("SP001")).thenReturn(true);

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Mã sản phẩm đã tồn tại");
    }

    @Test
    void create_thieuTen_baoLoi() {
        ProductRequest request = new ProductRequest();
        request.setCode("SP003");
        request.setName(""); // tên rỗng

        when(productRepository.existsById("SP003")).thenReturn(false);

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Thiếu tên sản phẩm");
    }

    @Test
    void update_capNhatThongTin_traThanhCong() {
        ProductUpdateRequest updateReq = new ProductUpdateRequest();
        updateReq.setName("iPhone 15 Pro");

        when(productRepository.findById("SP001")).thenReturn(Optional.of(product()));

        ProductResponse result = productService.update("SP001", updateReq);
        assertThat(result.getName()).isEqualTo("iPhone 15 Pro");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void update_sanPhamKhongTonTai_baoLoi() {
        ProductUpdateRequest updateReq = new ProductUpdateRequest();
        updateReq.setName("Moi ten");

        when(productRepository.findById("SP001")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.update("SP001", updateReq))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm có mã");
    }

    @Test
    void delete_xoaSanPham_chuaCoGiaoDich_traThanhCong() {
        Product p = product();
        when(productRepository.findById("SP001")).thenReturn(Optional.of(p));
        when(variantRepository.findByProduct(p)).thenReturn(List.of());
        when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, "SP001"))
                .thenReturn(java.util.Optional.empty());
        when(importDetailRepository.existsByProductVariant_Code("SP001")).thenReturn(false);
        when(orderRepository.countByDetailsVariantCode("SP001")).thenReturn(0L);

        productService.delete("SP001");
        verify(productRepository).delete(p);
        // Xuất hiện repository cho variants
        verify(variantRepository).findByProduct(p);
    }

    @Test
    void delete_sanPhamDaCoDonHang_baoLoi() {
        Product p = product();
        when(productRepository.findById("SP001")).thenReturn(Optional.of(p));
        when(variantRepository.findByProduct(p)).thenReturn(List.of());
        when(orderRepository.countByDetailsVariantCode("SP001")).thenReturn(1L); // đã có đơn

        assertThatThrownBy(() -> productService.delete("SP001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã phát sinh đơn hàng, không thể xóa sản phẩm");
    }

    @Test
    void delete_sanPhamCoTonKho_baoLoi() {
        Product p = product();
        when(productRepository.findById("SP001")).thenReturn(Optional.of(p));
        when(variantRepository.findByProduct(p)).thenReturn(List.of());
        when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, "SP001"))
                .thenReturn(java.util.Optional.of(
                        Inventory.builder()
                                .quantity(10)
                                .reservedQuantity(2)
                                .build()));

        assertThatThrownBy(() -> productService.delete("SP001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Biến thể còn tồn kho, không thể xóa sản phẩm");
    }

    @Test
    void importRows_dongDai_taoSanPhamMoi() {
        var parsed = new ExcelHelper.ParsedProductRow(1,
                new ProductRequest());
        parsed.request().setCode("SP003");
        parsed.request().setName("Sản phẩm mới");
        parsed.request().setCategoryCode(null);
        when(productRepository.existsById("SP003")).thenReturn(false);

        // Cần mock inventoryRepository sumAvailableQuantityByProduct
        lenient().when(inventoryRepository.sumAvailableQuantityByProduct(1L, "SP003"))
                .thenReturn(0);

        ImportResult result = productService.importRows(List.of(parsed));
        assertThat(result.getCreated()).isEqualTo(1);
        assertThat(result.getSkippedEmpty()).isZero();
    }

    @Test
    void importRows_tenThieu_boQuaDongNhomThem() {
        var parsed = new ExcelHelper.ParsedProductRow(1,
                new ProductRequest());
        parsed.request().setName("Sản phẩm mới");
        parsed.request().setCategoryCode(null);
        parsed.request().setBrandCode(null);
        parsed.request().setSupplierCode(null);
        when(productRepository.existsById("")).thenReturn(false);

        ImportResult result = productService.importRows(List.of(parsed));
        assertThat(result.getSkippedEmpty()).isEqualTo(1);
        assertThat(result.getCreated()).isZero();
    }

    @Test
    void importRows_maTrung_boQuaDongNhomThem() {
        var parsed = new ExcelHelper.ParsedProductRow(1,
                new ProductRequest());
        parsed.request().setCode("SP001");
        parsed.request().setName("Sản phẩm trùng lặp");
        parsed.request().setCategoryCode(null);
        parsed.request().setBrandCode(null);
        parsed.request().setSupplierCode(null);
        when(productRepository.existsById("SP001")).thenReturn(true);

        ImportResult result = productService.importRows(List.of(parsed));
        assertThat(result.getDuplicatedCodes()).containsExactly("SP001");
        assertThat(result.getCreated()).isZero();
    }
}