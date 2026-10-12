package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;

import com.salemanagement.dto.request.ProductVariantRequest;
import com.salemanagement.dto.request.ProductVariantUpdateRequest;
import com.salemanagement.dto.response.ProductVariantResponse;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Inventory;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.repository.ProductRepository;
import com.salemanagement.repository.CartItemRepository;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.ImportDetailRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.service.FileStorageService;
import com.salemanagement.service.impl.ProductVariantServiceImpl;

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
        doNothing().when(fileStorageService).deleteVariantImage(any());
        lenient().when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(any(), any()))
                .thenReturn(Optional.empty());
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
        when(variantRepository.findById("BT001")).thenReturn(java.util.Optional.of(variant()));
        ProductVariantResponse result = variantService.getDetail("BT001");
        assertThat(result.getCode()).isEqualTo("BT001");
        assertThat(result.getName()).isEqualTo("Đen 128GB");
    }

    @Test
    void getDetail_variantKhongTonTai_baoLoi() {
        when(variantRepository.findById("BT001")).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> variantService.getDetail("BT001"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không tìm thấy biến thể có mã");
    }
}