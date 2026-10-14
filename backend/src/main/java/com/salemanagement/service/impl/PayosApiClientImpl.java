package com.salemanagement.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.salemanagement.service.PayosApiClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class PayosApiClientImpl implements PayosApiClient {

    private static final String BASE_URL = "https://api-merchant.payos.vn";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${payos.client-id:}")
    private String clientId;

    @Value("${payos.api-key:}")
    private String apiKey;

    @Value("${payos.checksum-key:}")
    private String checksumKey;

    public PayosApiClientImpl() {
        // Project chưa dùng spring-boot-starter-json nên không có bean ObjectMapper
        // sẵn; jackson-databind đã có trên classpath (qua jjwt-jackson) nên tự tạo.
        this.objectMapper = new ObjectMapper();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public boolean isConfigured() {
        return StringUtils.hasText(clientId)
                && StringUtils.hasText(apiKey)
                && StringUtils.hasText(checksumKey);
    }

    @Override
    @SuppressWarnings("unchecked")
    public CreateLinkResult createPaymentLink(long orderCode, long amount, String description,
            String returnUrl, String cancelUrl) {
        requireConfigured();
        Map<String, Object> payload = new TreeMap<>();
        payload.put("orderCode", orderCode);
        payload.put("amount", amount);
        payload.put("description", description);
        payload.put("cancelUrl", cancelUrl);
        payload.put("returnUrl", returnUrl);
        payload.put("signature", sign(payload, checksumKey));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", clientId);
        headers.set("x-api-key", apiKey);

        Map<String, Object> response = restTemplate.postForObject(
                BASE_URL + "/v2/payment-requests", new HttpEntity<>(payload, headers), Map.class);
        if (response == null || !"00".equals(String.valueOf(response.get("code")))) {
            String desc = response == null ? "null" : String.valueOf(response.get("desc"));
            throw new IllegalStateException("Tạo link PayOS thất bại: " + desc);
        }
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        return new CreateLinkResult(
                str(data.get("checkoutUrl")), str(data.get("qrCode")),
                str(data.get("paymentLinkId")), toLong(data.get("orderCode")),
                toLong(data.get("amount")), str(data.get("accountNumber")),
                str(data.get("accountName")), str(data.get("description")));
    }

    @Override
    public boolean verifyWebhookSignature(Map<String, ?> data, String signature) {
        if (!StringUtils.hasText(signature) || !StringUtils.hasText(checksumKey)) {
            return false;
        }
        return sign(data, checksumKey).equalsIgnoreCase(signature.trim());
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException("Chưa cấu hình PayOS (thiếu PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY)");
        }
    }

    /**
     * Ký theo đúng docs PayOS: sắp xếp key theo alphabet, nối
     * {@code key=value} bằng {@code &} (null thành chuỗi rỗng, không encode URL),
     * rồi HMAC-SHA256 bằng checksum-key, trả về hex chữ thường.
     */
    String sign(Map<String, ?> data, String key) {
        Map<String, ?> sorted = new TreeMap<>(data);
        List<String> pairs = new ArrayList<>();
        for (Map.Entry<String, ?> entry : sorted.entrySet()) {
            if ("signature".equals(entry.getKey())) {
                continue;
            }
            pairs.add(entry.getKey() + "=" + stringify(entry.getValue()));
        }
        String raw = String.join("&", pairs);
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không ký được dữ liệu PayOS", e);
        }
    }

    private String stringify(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof Boolean b) {
            return b ? "true" : "false";
        }
        if (value instanceof Number || value instanceof String) {
            return String.valueOf(value);
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    private static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static long toLong(Object value) {
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception e) {
            return 0L;
        }
    }
}
