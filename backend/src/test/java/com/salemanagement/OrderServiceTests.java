package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.request.OrderRequest;
import com.salemanagement.dto.request.OrderRequest.OrderItemRequest;
import com.salemanagement.dto.response.OrderResponse;
import com.salemanagement.entity.Inventory;
import com.salemanagement.entity.Order;
import com.salemanagement.entity.OrderDetail;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.service.impl.OrderServiceImpl;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrderServiceTests {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private ProductVariantRepository variantRepository;

    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderServiceImpl(orderRepository, inventoryRepository, variantRepository);
        lenient().when(orderRepository.save(any(Order.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(inventoryRepository.save(any(Inventory.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        ProductVariant variant = new ProductVariant();
        variant.setCode("BT01");
        variant.setName("Test");
        variant.setPrice(new BigDecimal("1000000"));
        lenient().when(variantRepository.findById("BT01")).thenReturn(Optional.of(variant));
    }

    private Inventory inventory(int quantity, int reserved) {
        return Inventory.builder().quantity(quantity).reservedQuantity(reserved).build();
    }

    private OrderRequest request(String variantCode, int quantity) {
        return new OrderRequest("Khách Test", "0900000000", "test@shop.com", "Hà Nội",
                null, null, BigDecimal.ZERO,
                List.of(new OrderItemRequest(variantCode, "Sản phẩm Test",
                        quantity, new BigDecimal("1000000"))));
    }

    private Order orderWithDetail(String code, String status, String variantCode, int quantity) {
        Order order = new Order();
        order.setCode(code);
        order.setStatus(status);
        order.setUsername("customer");
        OrderDetail detail = new OrderDetail();
        detail.setOrder(order);
        detail.setVariantCode(variantCode);
        detail.setProductName("Sản phẩm Test");
        detail.setQuantity(quantity);
        detail.setUnitPrice(new BigDecimal("1000000"));
        order.getDetails().add(detail);
        return order;
    }

    @Test
    void datHangDuTon_giuChoChuaTru() {
        when(inventoryRepository.findByWarehouseIdAndProductVariant_CodeForUpdate(1L, "BT01"))
                .thenReturn(Optional.of(inventory(10, 0)));

        OrderResponse response = orderService.create(request("BT01", 2), "customer");

        assertThat(response.status()).isEqualTo(Order.STATUS_PENDING);
        assertThat(response.details()).hasSize(1);
        verify(inventoryRepository).save(org.mockito.ArgumentMatchers.argThat(
                inv -> inv.getQuantity() == 10 && inv.getReservedQuantity() == 2));
    }

    @Test
    void datHangVuotTon_baoLoiVaKhongTaoDon() {
        when(inventoryRepository.findByWarehouseIdAndProductVariant_CodeForUpdate(1L, "BT01"))
                .thenReturn(Optional.of(inventory(10, 9)));

        assertThatThrownBy(() -> orderService.create(request("BT01", 2), "customer"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("chỉ còn 1 sản phẩm có thể bán");
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void traVietQR_ghiNhanPhuongThucChuaTruKho() {
        Order order = orderWithDetail("DH90", Order.STATUS_PENDING, "BT01", 2);
        when(orderRepository.findById("DH90")).thenReturn(Optional.of(order));

        OrderResponse response = orderService.confirmPayment("DH90", "VIETQR", "customer");

        assertThat(response.status()).isEqualTo(Order.STATUS_PENDING);
        assertThat(response.paymentMethod()).isEqualTo("VIETQR");
        assertThat(order.isStockDeducted()).isFalse();
        verify(inventoryRepository, never()).save(any(Inventory.class));
    }

    @Test
    void hoanThanh_truKhoDungMotLan() {
        Order order = orderWithDetail("DH91", Order.STATUS_SHIPPING, "BT01", 2);
        when(orderRepository.findById("DH91")).thenReturn(Optional.of(order));
        Inventory stock = inventory(10, 2);
        when(inventoryRepository.findByWarehouseIdAndProductVariant_CodeForUpdate(1L, "BT01"))
                .thenReturn(Optional.of(stock));

        OrderResponse first = orderService.updateStatus("DH91", Order.STATUS_COMPLETED);
        OrderResponse second = orderService.updateStatus("DH91", Order.STATUS_COMPLETED);

        assertThat(first.status()).isEqualTo(Order.STATUS_COMPLETED);
        assertThat(second.status()).isEqualTo(Order.STATUS_COMPLETED);
        assertThat(stock.getQuantity()).isEqualTo(8);
        assertThat(stock.getReservedQuantity()).isZero();
    }

    @Test
    void duyetDonChuaChonPhuongThuc_biChan() {
        Order order = orderWithDetail("DH92", Order.STATUS_PENDING, "BT01", 1);
        when(orderRepository.findById("DH92")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus("DH92", Order.STATUS_CONFIRMED))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("chưa chọn phương thức thanh toán");
    }

    @Test
    void huyDonDaTruKho_congTraTonVaGhiNoHoanTien() {
        Order order = orderWithDetail("DH93", Order.STATUS_PENDING, "BT01", 2);
        order.setStockDeducted(true);
        when(orderRepository.findById("DH93")).thenReturn(Optional.of(order));
        Inventory stock = inventory(8, 0);
        when(inventoryRepository.findByWarehouseIdAndProductVariant_CodeForUpdate(1L, "BT01"))
                .thenReturn(Optional.of(stock));

        OrderResponse response = orderService.cancelByOwner("DH93", "customer");

        assertThat(response.status()).isEqualTo(Order.STATUS_CANCELLED);
        assertThat(stock.getQuantity()).isEqualTo(10);
        assertThat(order.getNote()).contains("hoàn tiền");
    }
}
