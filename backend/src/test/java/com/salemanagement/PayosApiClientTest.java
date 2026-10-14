package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;

import com.salemanagement.service.impl.PayosApiClientImpl;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PayosApiClientTest {

    private static final String CHECKSUM = "checksum-key-cho-test";

    private PayosApiClientImpl client;

    @BeforeEach
    void setUp() {
        client = new PayosApiClientImpl();
        org.springframework.test.util.ReflectionTestUtils.setField(client, "checksumKey", CHECKSUM);
    }

    private String sign(Map<String, ?> data) throws Exception {
        Method method = PayosApiClientImpl.class
                .getDeclaredMethod("sign", Map.class, String.class);
        method.setAccessible(true);
        return (String) method.invoke(client, data, CHECKSUM);
    }

    @Test
    void ky_khacThuTuKey_nhungCungChuKy() throws Exception {
        Map<String, Object> a = new LinkedHashMap<>();
        a.put("orderCode", 123L);
        a.put("amount", 50000L);
        a.put("description", "DH Andrew");
        Map<String, Object> b = new HashMap<>();
        b.put("description", "DH Andrew");
        b.put("amount", 50000L);
        b.put("orderCode", 123L);

        assertThat(sign(a)).isEqualTo(sign(b));
    }

    @Test
    void verify_dungChuKy_traTrue_saiChuKy_traFalse() throws Exception {
        Map<String, Object> data = Map.of("orderCode", 123L, "amount", 50000L);
        String signature = sign(data);

        assertThat(client.verifyWebhookSignature(data, signature)).isTrue();
        assertThat(client.verifyWebhookSignature(data, signature.toUpperCase())).isTrue();
        assertThat(client.verifyWebhookSignature(Map.of("orderCode", 124L, "amount", 50000L), signature))
                .isFalse();
        assertThat(client.verifyWebhookSignature(data, "sai")).isFalse();
        assertThat(client.verifyWebhookSignature(data, "")).isFalse();
        assertThat(client.verifyWebhookSignature(data, null)).isFalse();
    }

    @Test
    void giaTriNull_duocTinhNhuChuoiRong() throws Exception {
        Map<String, Object> withNull = new HashMap<>();
        withNull.put("a", "1");
        withNull.put("b", null);
        Map<String, Object> withEmpty = Map.of("a", "1", "b", "");

        assertThat(sign(withNull)).isEqualTo(sign(withEmpty));
    }

    @Test
    void khoaSignature_duocBoQuaKhiKy() throws Exception {
        Map<String, Object> data = new HashMap<>(Map.of("orderCode", 123L));
        data.put("signature", "chu-ky-cu");

        assertThat(sign(data)).isEqualTo(sign(Map.of("orderCode", 123L)));
    }
}
