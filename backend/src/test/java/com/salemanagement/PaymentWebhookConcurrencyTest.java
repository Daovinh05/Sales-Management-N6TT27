package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.salemanagement.entity.Order;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.service.PayosApiClient;
import com.salemanagement.service.PaymentService;
import com.salemanagement.service.impl.PaymentServiceImpl;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Hai webhook cùng mã đơn tới đồng thời: nhờ khóa bi quan, đúng một luồng
 * ghi nhận, luồng còn lại thấy đã trả và dừng — không ghi 2 lần.
 */
@DataJpaTest
@Import(PaymentServiceImpl.class)
class PaymentWebhookConcurrencyTest {

    private static final String CODE = "DH-RACE";

    @Autowired
    private OrderRepository orderRepository;

    // Service là bean thật (có proxy @Transactional) để khóa bi quan hoạt động.
    @Autowired
    private PaymentServiceImpl paymentService;

    @MockitoBean
    private PayosApiClient payosApiClient;

    @AfterEach
    void cleanUp() {
        orderRepository.deleteById(CODE);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void haiWebhookDongThoi_chiMotLuotGhiNhan() throws Exception {
        when(payosApiClient.verifyWebhookSignature(any(), any())).thenReturn(true);
        Order order = new Order();
        order.setCode(CODE);
        order.setCustomerName("Khách đua");
        order.setUsername("khach-dua");
        order.setStatus(Order.STATUS_PENDING);
        order.setPaymentAmount(new BigDecimal("50000"));
        order.setPayosOrderCode(777001L);
        orderRepository.saveAndFlush(order);

        Map<String, Object> data = new HashMap<>();
        data.put("orderCode", 777001L);
        data.put("amount", 50000L);
        Map<String, Object> body = new HashMap<>();
        body.put("code", "00");
        body.put("data", data);
        body.put("signature", "hop-le");

        CountDownLatch startGate = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<PaymentService.WebhookOutcome> first = pool.submit(() -> {
                startGate.await(10, TimeUnit.SECONDS);
                return paymentService.handlePayosWebhook(body);
            });
            Future<PaymentService.WebhookOutcome> second = pool.submit(() -> {
                startGate.await(10, TimeUnit.SECONDS);
                return paymentService.handlePayosWebhook(body);
            });
            startGate.countDown();
            PaymentService.WebhookOutcome outcome1 = first.get(30, TimeUnit.SECONDS);
            PaymentService.WebhookOutcome outcome2 = second.get(30, TimeUnit.SECONDS);

            assertThat(List.of(outcome1.accepted(), outcome2.accepted()))
                    .containsExactly(true, true);
            List<String> messages = List.of(outcome1.message(), outcome2.message());
            assertThat(messages).contains("Đã ghi nhận thanh toán");
            assertThat(messages.stream().filter(m -> m.contains("trước đó")).count()).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }

        Order saved = orderRepository.findById(CODE).orElseThrow();
        assertThat(saved.isPaid()).isTrue();
        assertThat(saved.getPaidAt()).isNotNull();
        assertThat(saved.getPaymentMethod()).isEqualTo("VIETQR");
    }
}
