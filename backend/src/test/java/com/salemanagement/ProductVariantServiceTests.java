package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.request.ProductVariantRequest;
import com.salemanation.dto.request.ProductVariantUpdateRequest;
import com.salemanation.dto.response.ProductVariantResponse;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.CartItemRepository;
import com.salemanagement.repository.ImportDetailRepository;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.CartItemRepository;
import com.salemanation.repository.OrderRepository;
import com.salemanagement.service.FileStorageService;
import com.salemanagement.service.impl.ProductVariantServiceImpl;
import com.salemanagement.util.ExcelHelper.ParsedVariantRow;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Tests for Product Variant Service - Quản lý biến thể sản phẩm.
 * Tuân theo Constitution Principle III: Test làm bằng chứng.
 * Viết bằng tiếng Việt (Principle VI).
 */
@ExtendWith(MockitoExtension.class)
class ProductVariantServiceTests {

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ImportDetailRepository importDetailRepository;

    @Mock
    private OrderRepository orderRepository;

    private ProductVariantServiceImpl variantService;

    @BeforeEach
    void setUp() {
        variantService = new ProductVariantServiceImpl(
                variantRepository, productRepository, fileStorageService,
                cartItemRepository, inventoryRepository, importDetailRepository,
                orderRepository);
        lenient().when(fileStorageService.storeVariantImage(any()))
                .thenReturn("test-image.jpg");
        lenient().doNothing().when(fileStorageService).deleteVariantImage(any());
        lenient().when(variantRepository.save(any(ProductVariant.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Product product() {
        Product p = new Product();
        p.setCode("SP001");
        p.setName("iPhone");
        return p;
    }

    private ProductVariant variant() {
        ProductVariant v = new ProductVariant();
        v.setCode("BT001");
        v.setName("Đen 128GB");
        v.setColor("Đen");
        v.setRam("128");
        v.setStorage("512");
        v.setPrice(new BigDecimal("15000000"));
        return v;
    }

    private void stubDeletable(String code) {
        lenient().when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, code))
                .thenReturn(Optional.empty());
        lenient().when(importDetailRepository.existsByProductVariant_Code(code))
                .thenReturn(false);
        lenient().when(orderRepository.countByDetailsVariantCode(code)).thenReturn(0L);
    }

    @Test
    void list_khongTimKiem_traLayDanhSachRong() {
        when(variantRepository.search(null, null)).thenReturn(List.of());
        List<ProductVariantResponse> result = variantService.list(null, null);
        assertThat(result).isEmpty();
    }

    @Test
    void list_timKiemTheoTen_traKetQua() {
        ProductVariant v = variant();
        when(variantRepository.search(null, "Đen")).thenReturn(List.of(v));
        List<ProductVariantResponse> result = variantService.list(null, "Đen");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Đen 128GB");
    }

    @Test
    void getDetail_variantTonTai_traThongTin() {
        when(variantRepository.findById("BT001")).thenReturn(Optional.of(variant()));
        ProductVariantResponse result = variantService.getDetail("BT001");
        assertThat(result.getCode()).isEqualTo("BT001");
        assertThat(result.getName()).isEqualTo("Đen 128GB");
    }

    @Test
    void getDetail_variantKhongTonTai_baoLoi() {
        when(variantRepository.findById("BT001")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> variantService.getDetail("BT001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không tìm thấy biến thể có mã");
    }

    @Test
    void listByProduct_sanPhamCoVariants_traDanhSach() {
        Product p = product();
        ProductVariant v = variant();
        v.setProduct(p);
        when(productRepository.findById("SP001")).thenReturn(Optional.of(p));
        when(variantRepository.findByProduct(p)).thenReturn(List.of(v));

        List<ProductVariantResponse> result = variantService.listByProduct("SP001");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProductCode()).isEqualTo("SP001");
        assertThat(result.get(0).getProductName()).isEqualTo("iPhone");
    }

    @Test
    void listByProduct_sanPhamKhongTonTai_baoLoi() {
        when(productRepository.findById("SP001")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> variantService.listByProduct("SP001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm có mã");
    }

    @Test
    void create_variantMoi_traThanhCong() {
        ProductVariantRequest request = new ProductVariantRequest();
        request.setCode("BT002");
        request.setProductCode("SP001");
        request.setName("Trắng 256GB");
        request.setColor("Trắng");
        request.setRam("256");
        request.setStorage("256");
        request.setPrice(new BigDecimal("16000000"));

        when(variantRepository.existsById("BT002")).thenReturn(false);
        when(productRepository.findById("SP001")).thenReturn(Optional.of(product()));

        ProductVariantResponse result = variantService.create(request, null);
        assertThat(result.getCode()).isEqualTo("BT002");
        assertThat(result.getName()).isEqualTo("Trắng 256GB");
        verify(variantRepository).save(any(ProductVariant.class));
    }

    @Test
    void create_variantDaTonTai_baoLoi() {
        ProductVariantRequest request = new ProductVariantRequest();
        request.setCode("BT001");
        request.setProductCode("SP001");

        when(variantRepository.existsById("BT001")).thenReturn(true);

        assertThatThrownBy(() -> variantService.create(request, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Mã biến thể đã tồn tại");
    }

    @Test
    void update_capNhatVariants_traThanhCong() {
        ProductVariantUpdateRequest updateReq = new ProductVariantUpdateRequest();
        updateReq.setProductCode("SP001");
        updateReq.setName("Đen 256GB");

        when(variantRepository.findById("BT001")).thenReturn(Optional.of(variant()));
        when(productRepository.findById("SP001")).thenReturn(Optional.of(product()));

        ProductVariantResponse result = variantService.update("BT001", updateReq, null);
        assertThat(result.getName()).isEqualTo("Đen 256GB");
        verify(variantRepository).save(any(ProductVariant.class));
    }

    @Test
    void update_variantKhongTonTai_baoLoi() {
        ProductVariantUpdateRequest updateReq = new ProductVariantUpdateRequest();
        updateReq.setName("Moi ten");

        when(variantRepository.findById("BT001")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> variantService.update("BT001", updateReq, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không tìm thấy biến thể có mã");
    }

    @Test
    void delete_variantChuaCoGiaoDich_traThanhCong() {
        ProductVariant v = variant();
        when(variantRepository.findById("BT001")).thenReturn(Optional.of(v));
        stubDeletable("BT001");

        variantService.delete("BT001");
        verify(variantRepository).delete(v);
    }

    @Test
    void delete_variantCoTonKho_baoLoi() {
        ProductVariant v = variant();
        when(variantRepository.findById("BT001")).thenReturn(Optional.of(v));
        when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, "BT001"))
                .thenReturn(Optional.of(Inventory.builder()
                        .quantity(10)
                        .reservedQuantity(0)
                        .build()));

        assertThatThrownBy(() -> variantService.delete("BT001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("còn tồn kho");
    }

    @Test
    void delete_variantDaPhatSinhPhieuNhap_baoLoi() {
        ProductVariant v = variant();
        when(variantRepository.findById("BT001")).thenReturn(Optional.of(v));
        when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, "BT001"))
                .thenReturn(Optional.empty());
        when(importDetailRepository.existsByProductVariant_Code("BT001")).thenReturn(true);

        assertThatThrownBy(() -> variantService.delete("BT001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã phát sinh phiếu nhập, không thể xóa");
    }

    @Test
    void delete_variantDaPhatSinhDonHang_baoLoi() {
        ProductVariant v = variant();
        when(variantRepository.findById("BT001")).thenReturn(Optional.of(v));
        when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, "BT001"))
                .thenReturn(Optional.empty());
        when(importDetailRepository.existsByProductVariant_Code("BT001")).thenReturn(false);
        when(orderRepository.countByDetailsVariantCode("BT001")).thenReturn(1L);

        assertThatThrownBy(() -> variantService.delete("BT001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã phát sinh đơn hàng, không thể xóa");
    }

    @Test
    void importRows_dongDai_taoVariantsMoi() {
        ProductVariantRequest request = new ProductVariantRequest();
        request.setCode("BT003");
        request.setProductCode("SP001");
        request.setName("Variant test");
        request.setColor("Đỏ");
        request.setRam("64");
        request.setStorage("128");
        request.setPrice(new BigDecimal("10000000"));

        when(variantRepository.existsById("BT003")).thenReturn(false);
        when(productRepository.findById("SP001")).thenReturn(Optional.of(product()));

        com.salemanagement.dto.response.ImportResult result =
                variantService.importRows(List.of(new ParsedVariantRow(2, request)));
        assertThat(result.getCreated()).isEqualTo(1);
        assertThat(result.getSkippedEmpty()).isZero();
    }

    @Test
    void importRows_thieuMaSanPham_ghiNhanDongLoi() {
        ProductVariantRequest request = new ProductVariantRequest();
        request.setCode("BT004");
        request.setProductCode("");

        com.salemanagement.dto.response.ImportResult result =
                variantService.importRows(List.of(new ParsedVariantRow(3, request)));
        assertThat(result.getFailedRows()).hasSize(1);
        assertThat(result.getCreated()).isZero();
    }

    @Test
    void importRows_maRong_boQuaDongNhomThem() {
        ProductVariantRequest request = new ProductVariantRequest();
        request.setCode("");

        com.salemanagement.dto.response.ImportResult result =
                variantService.importRows(List.of(new ParsedVariantRow(4, request)));
        assertThat(result.getSkippedEmpty()).isEqualTo(1);
        assertThat(result.getCreated()).isZero();
    }

    @Test
    void importRows_maTrung_boQuaDongNhomThem() {
        ProductVariantRequest request = new ProductVariantRequest();
        request.setCode("BT001");
        request.setProductCode("SP001");

        when(variantRepository.existsById("BT001")).thenReturn(true);

        com.salemanagement.dto.response.ImportResult result =
                variantService.importRows(List.of(new ParsedVariantRow(5, request)));
        assertThat(result.getDuplicatedCodes()).containsExactly("BT001");
        assertThat(result.getCreated()).isZero();
    }
}
