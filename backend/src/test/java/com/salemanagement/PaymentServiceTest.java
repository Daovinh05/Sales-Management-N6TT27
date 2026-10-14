package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.response.VietQrLinkResponse;
import com.salemanagement.entity.Order;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.service.PayosApiClient;
import com.salemanagement.service.PaymentService;
import com.salemanagement.service.impl.PaymentServiceImpl;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PayosApiClient payosApiClient;

    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentServiceImpl(orderRepository, payosApiClient);
        ReflectionTestUtils.setField(paymentService, "frontendUrl", "http://localhost:5173");
        lenient().when(orderRepository.save(any(Order.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private Order pendingOrder() {
        Order order = new Order();
        order.setCode("DH1");
        order.setUsername("khach1");
        order.setStatus(Order.STATUS_PENDING);
        order.setPaymentAmount(new BigDecimal("50000"));
        return order;
    }

    @Test
    void taoLink_chuaCauHinhPayos_traFallbackDemo() {
        when(orderRepository.findById("DH1")).thenReturn(Optional.of(pendingOrder()));
        when(payosApiClient.isConfigured()).thenReturn(false);

        VietQrLinkResponse response = paymentService.createVietQrLink("DH1", "khach1");

        assertThat(response.payosConfigured()).isFalse();
    }

    @Test
    void taoLink_donCuaNguoiKhac_biChan() {
        when(orderRepository.findById("DH1")).thenReturn(Optional.of(pendingOrder()));

        assertThatThrownBy(() -> paymentService.createVietQrLink("DH1", "kela"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void taoLink_daThanhToan_biChan() {
        Order order = pendingOrder();
        order.setPaid(true);
        when(orderRepository.findById("DH1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.createVietQrLink("DH1", "khach1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã được thanh toán");
    }

    @Test
    void taoLink_thanhCong_luuMaPayosVaoDon() {
        Order order = pendingOrder();
        when(orderRepository.findById("DH1")).thenReturn(Optional.of(order));
        when(payosApiClient.isConfigured()).thenReturn(true);
        when(payosApiClient.createPaymentLink(any(Long.class), any(Long.class),
                any(String.class), any(String.class), any(String.class)))
                .thenReturn(new PayosApiClient.CreateLinkResult(
                        "https://pay.payos.vn/web/abc", "qr-payload", "link-1",
                        999L, 50000L, "0825303888", "SHOP", "DH1"));

        VietQrLinkResponse response = paymentService.createVietQrLink("DH1", "khach1");

        assertThat(response.payosConfigured()).isTrue();
        assertThat(response.checkoutUrl()).startsWith("https://");
        assertThat(order.getPayosOrderCode()).isEqualTo(999L);
        assertThat(order.getPaymentLinkId()).isEqualTo("link-1");
        assertThat(order.getPaymentMethod()).isEqualTo("VIETQR");
    }

    private Map<String, Object> webhookBody(long payosCode, long amount, String code) {
        Map<String, Object> data = new HashMap<>();
        data.put("orderCode", payosCode);
        data.put("amount", amount);
        Map<String, Object> body = new HashMap<>();
        body.put("code", code);
        body.put("data", data);
        body.put("signature", "hop-le");
        return body;
    }

    @Test
    void webhook_saiChuKy_tuChoi() {
        when(payosApiClient.verifyWebhookSignature(any(), any())).thenReturn(false);

        PaymentService.WebhookOutcome outcome =
                paymentService.handlePayosWebhook(webhookBody(999L, 50000L, "00"));

        assertThat(outcome.accepted()).isFalse();
    }

    @Test
    void webhook_thanhCong_danhDauDaThanhToan() {
        Order order = pendingOrder();
        order.setPayosOrderCode(999L);
        when(payosApiClient.verifyWebhookSignature(any(), any())).thenReturn(true);
        when(orderRepository.findByPayosOrderCode(999L)).thenReturn(Optional.of(order));

        PaymentService.WebhookOutcome outcome =
                paymentService.handlePayosWebhook(webhookBody(999L, 50000L, "00"));

        assertThat(outcome.accepted()).isTrue();
        assertThat(order.isPaid()).isTrue();
        assertThat(order.getPaidAt()).isNotNull();
        assertThat(order.getPaymentMethod()).isEqualTo("VIETQR");
    }

    @Test
    void webhook_goi2Lan_chiGhiNhan1Lan() {
        Order order = pendingOrder();
        order.setPayosOrderCode(999L);
        order.setPaid(true);
        when(payosApiClient.verifyWebhookSignature(any(), any())).thenReturn(true);
        when(orderRepository.findByPayosOrderCode(999L)).thenReturn(Optional.of(order));

        PaymentService.WebhookOutcome outcome =
                paymentService.handlePayosWebhook(webhookBody(999L, 50000L, "00"));

        assertThat(outcome.accepted()).isTrue();
        assertThat(outcome.message()).contains("trước đó");
    }

    @Test
    void webhook_lechTien_tuChoi() {
        Order order = pendingOrder();
        order.setPayosOrderCode(999L);
        when(payosApiClient.verifyWebhookSignature(any(), any())).thenReturn(true);
        when(orderRepository.findByPayosOrderCode(999L)).thenReturn(Optional.of(order));

        PaymentService.WebhookOutcome outcome =
                paymentService.handlePayosWebhook(webhookBody(999L, 10000L, "00"));

        assertThat(outcome.accepted()).isFalse();
        assertThat(order.isPaid()).isFalse();
    }

    @Test
    void webhook_maLa_boQuaNhungVan200() {
        when(payosApiClient.verifyWebhookSignature(any(), any())).thenReturn(true);
        when(orderRepository.findByPayosOrderCode(888L)).thenReturn(Optional.empty());

        PaymentService.WebhookOutcome outcome =
                paymentService.handlePayosWebhook(webhookBody(888L, 50000L, "00"));

        assertThat(outcome.accepted()).isTrue();
    }
}
