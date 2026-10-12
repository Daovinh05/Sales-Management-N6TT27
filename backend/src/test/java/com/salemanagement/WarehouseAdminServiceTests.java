package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.request.UpdateImportStatusRequest;
import com.salemanagement.entity.ImportDetail;
import com.salemanagement.entity.ImportReceipt;
import com.salemanagement.entity.Inventory;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.Warehouse;
import com.salemanagement.enums.EImportStatus;
import com.salemanagement.repository.ImportReceiptRepository;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.repository.WarehouseRepository;
import com.salemanagement.service.impl.WarehouseAdminServiceImpl;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WarehouseAdminServiceTests {

    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ImportReceiptRepository importReceiptRepository;
    @Mock
    private InventoryRepository inventoryRepository;

    private WarehouseAdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        adminService = new WarehouseAdminServiceImpl(warehouseRepository, userRepository,
                importReceiptRepository, inventoryRepository);
        lenient().when(warehouseRepository.findById(1L)).thenReturn(
                Optional.of(Warehouse.builder().id(1L).name("Kho trung tâm").build()));
        lenient().when(inventoryRepository.save(any(Inventory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private ProductVariant variant() {
        ProductVariant variant = new ProductVariant();
        variant.setCode("BT01");
        variant.setName("Test");
        variant.setPrice(new BigDecimal("1000000"));
        return variant;
    }

    private ImportReceipt receipt(EImportStatus status, int quantity) {
        ImportReceipt receipt = ImportReceipt.builder().status(status).details(new ArrayList<>()).build();
        receipt.getDetails().add(ImportDetail.builder()
                .productVariant(variant())
                .quantity(quantity)
                .unitPrice(new BigDecimal("800000"))
                .build());
        return receipt;
    }

    private UpdateImportStatusRequest request(String status) {
        UpdateImportStatusRequest request = new UpdateImportStatusRequest();
        request.setStatus(status);
        return request;
    }

    @Test
    void duyetPhieuNhap_congTonTheoSoLuongNhap() {
        when(importReceiptRepository.findByIdWithFullDetails(7L))
                .thenReturn(Optional.of(receipt(EImportStatus.PENDING, 5)));
        when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, "BT01"))
                .thenReturn(Optional.empty());

        adminService.updateImportStatus(7L, request("APPROVED"));

        verify(inventoryRepository).save(org.mockito.ArgumentMatchers.argThat(
                inv -> inv.getQuantity() == 5 && inv.getReservedQuantity() == 0));
        verify(importReceiptRepository).save(org.mockito.ArgumentMatchers.argThat(
                saved -> saved.getStatus() == EImportStatus.APPROVED));
    }

    @Test
    void duyetPhieuHaiLan_lanHaiBiChanKhongCongTon() {
        ImportReceipt saved = receipt(EImportStatus.PENDING, 5);
        when(importReceiptRepository.findByIdWithFullDetails(7L)).thenReturn(Optional.of(saved));
        when(inventoryRepository.findByWarehouseIdAndProductVariant_Code(1L, "BT01"))
                .thenReturn(Optional.empty());

        adminService.updateImportStatus(7L, request("APPROVED"));

        assertThatThrownBy(() -> adminService.updateImportStatus(7L, request("APPROVED")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã được xử lý");
        verify(inventoryRepository, times(1)).save(any(Inventory.class));
    }

    @Test
    void tuChoiPhieu_khongDongDenTonKho() {
        when(importReceiptRepository.findByIdWithFullDetails(7L))
                .thenReturn(Optional.of(receipt(EImportStatus.PENDING, 5)));

        adminService.updateImportStatus(7L, request("REJECTED"));

        verify(warehouseRepository, never()).findById(any());
        verify(inventoryRepository, never()).save(any(Inventory.class));
        verify(importReceiptRepository).save(org.mockito.ArgumentMatchers.argThat(
                saved -> saved.getStatus() == EImportStatus.REJECTED));
    }
}
