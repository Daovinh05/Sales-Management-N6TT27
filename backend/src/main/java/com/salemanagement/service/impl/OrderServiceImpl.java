package com.salemanagement.service.impl;

import com.salemanagement.dto.request.OrderRequest;
import com.salemanagement.dto.response.OrderResponse;
import com.salemanagement.entity.Inventory;
import com.salemanagement.entity.Order;
import com.salemanagement.entity.OrderDetail;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.InventoryRepository;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.service.OrderService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final Set<String> STATUSES = Set.of(
            Order.STATUS_PENDING, Order.STATUS_CONFIRMED, Order.STATUS_SHIPPING,
            Order.STATUS_COMPLETED, Order.STATUS_CANCELLED);

    private static final Set<String> PAYMENT_METHODS = Set.of("COD", "VIETQR");

    // Trạng thái chỉ đi tiến, không nhảy cóc hay đi lùi.
    // Đơn kết thúc (HOAN_THANH / DA_HUY) không đổi nữa.
    private static final Map<String, Set<String>> NEXT_STATUSES = Map.of(
            Order.STATUS_PENDING, Set.of(Order.STATUS_CONFIRMED, Order.STATUS_CANCELLED),
            Order.STATUS_CONFIRMED, Set.of(Order.STATUS_SHIPPING, Order.STATUS_CANCELLED),
            Order.STATUS_SHIPPING, Set.of(Order.STATUS_COMPLETED, Order.STATUS_CANCELLED),
            Order.STATUS_COMPLETED, Set.of(),
            Order.STATUS_CANCELLED, Set.of());

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository variantRepository;

    // Đồng bộ với luồng nhập kho: toàn bộ tồn kho nằm ở kho trung tâm id = 1.
    private static final Long CENTRAL_WAREHOUSE_ID = 1L;

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> list(String code, String customerName, String status, String paymentMethod) {
        return orderRepository
                .filter(code == null ? "" : code.trim(),
                        customerName == null ? "" : customerName.trim(),
                        status == null ? "" : status.trim().toUpperCase(),
                        paymentMethod == null ? "" : paymentMethod.trim().toUpperCase())
                .stream()
                .map(OrderResponse::summary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> myOrders(String username) {
        return orderRepository.findByUsernameOrderByCreatedAtDesc(username).stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse detail(String code) {
        return OrderResponse.from(findOrder(code));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse ownerDetail(String code, String username) {
        Order order = findOrder(code);
        if (username == null || !username.equals(order.getUsername())) {
            throw new BusinessException("Bạn không có quyền xem đơn hàng này", HttpStatus.FORBIDDEN);
        }
        return OrderResponse.from(order);
    }

    @Override
    @Transactional
    public OrderResponse create(OrderRequest request, String username) {
        Order order = new Order();
        order.setCode(nextCode());
        order.setUsername(username);
        order.setCustomerName(request.customerName().trim());
        order.setCustomerPhone(normalize(request.customerPhone()));
        order.setEmail(normalize(request.email()));
        order.setShippingAddress(normalize(request.shippingAddress()));
        order.setNote(normalize(request.note()));
        order.setPaymentMethod(normalize(request.paymentMethod()));
        order.setDiscountAmount(nonNegative(request.discountAmount()));
        order.setStatus(Order.STATUS_PENDING);

        BigDecimal total = BigDecimal.ZERO;
        for (OrderRequest.OrderItemRequest item : request.items()) {
            if (item.variantCode() == null || item.variantCode().isBlank()) {
                throw new BusinessException("Mã biến thể không được để trống", HttpStatus.BAD_REQUEST);
            }
            // Giá bán lấy từ server theo variant, không tin unitPrice client gửi lên.
            String variantCode = item.variantCode().trim().toUpperCase();
            ProductVariant variant = variantRepository.findById(variantCode)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy biến thể: " + item.variantCode()));
            BigDecimal unitPrice = variant.getPrice() == null ? BigDecimal.ZERO : variant.getPrice();
            String productName = item.productName() == null || item.productName().isBlank()
                    ? resolveVariantName(variant)
                    : item.productName().trim();
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setVariantCode(variant.getCode());
            detail.setProductName(productName);
            detail.setQuantity(item.quantity());
            detail.setUnitPrice(unitPrice);
            order.getDetails().add(detail);
            total = total.add(detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity())));

            // Giữ chỗ tồn kho ngay khi đặt hàng (chưa trừ quantity).
            // Ném lỗi nếu hết hàng để không bán lố.
            reserveStock(detail.getVariantCode(), detail.getQuantity(), detail.getProductName());
        }
        order.setTotalAmount(total);
        order.setPaymentAmount(total.subtract(order.getDiscountAmount()).max(BigDecimal.ZERO));
        return OrderResponse.from(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(String code, String status) {
        if (!STATUSES.contains(status)) {
            throw new BusinessException("Trạng thái đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        Order order = findOrder(code);
        String oldStatus = order.getStatus();
        if (oldStatus.equals(status)) {
            return OrderResponse.from(order);
        }
        // Đơn đã kết thúc (hoàn thành / đã hủy) thì không được đổi nữa,
        // tránh trừ kho 2 lần hoặc hồi kho sai.
        if (!NEXT_STATUSES.getOrDefault(oldStatus, Set.of()).contains(status)) {
            throw new BusinessException("Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này",
                    HttpStatus.BAD_REQUEST);
        }

        if (Order.STATUS_CANCELLED.equals(status)) {
            // Hủy đơn đang xử lý: trả chỗ đã giữ; đơn đã trừ kho (VietQR)
            // thì cộng trả quantity để không mất tồn.
            if (order.isStockDeducted()) {
                restoreStock(order);
                order.setStockDeducted(false);
            } else {
                releaseReservedStock(order);
            }
        } else if (Order.STATUS_COMPLETED.equals(status)) {
            // Hoàn thành: xuất kho thực tế nếu trước đó chưa trừ (đơn COD).
            deductStockIfNeeded(order);
        }

        order.setStatus(status);
        return OrderResponse.from(orderRepository.save(order));
    }

    @Override
    @Transactional
    public void delete(String code) {
        Order order = findOrder(code);
        // Xóa đơn đang xử lý thì trả lại chỗ đã giữ;
        // đơn đã trừ kho thì cộng trả quantity để không mất tồn.
        if (!Order.STATUS_COMPLETED.equals(order.getStatus())
                && !Order.STATUS_CANCELLED.equals(order.getStatus())) {
            releaseReservedStock(order);
        } else if (order.isStockDeducted()) {
            restoreStock(order);
            order.setStockDeducted(false);
        }
        orderRepository.deleteById(code.trim().toUpperCase());
    }

    @Override
    @Transactional
    public OrderResponse confirmPayment(String code, String paymentMethod, String username) {
        if (paymentMethod == null || !PAYMENT_METHODS.contains(paymentMethod.trim().toUpperCase())) {
            throw new BusinessException("Phương thức thanh toán không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        Order order = findOrder(code);
        checkOwner(order, username);
        if (!Order.STATUS_PENDING.equals(order.getStatus())) {
            throw new BusinessException("Đơn hàng không còn ở trạng thái chờ thanh toán", HttpStatus.BAD_REQUEST);
        }
        String method = paymentMethod.trim().toUpperCase();
        order.setPaymentMethod(method);
        if ("VIETQR".equals(method)) {
            // QR demo: khách tự xác nhận đã chuyển khoản -> xuất kho ngay,
            // nhưng đơn vẫn ở CHO_DUYET chờ shop duyệt như COD.
            deductStockIfNeeded(order);
        }
        // COD: giữ CHO_DUYET chờ shop xác nhận, trừ kho ở HOAN_THANH.
        return OrderResponse.from(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse cancelByOwner(String code, String username) {
        Order order = findOrder(code);
        checkOwner(order, username);
        // Khách được hủy khi đơn chưa giao: CHO_DUYET (nhả chỗ giữ)
        // hoặc DA_XAC_NHAN (cộng trả tồn đã trừ, shop hoàn tiền thủ công).
        if (!Order.STATUS_PENDING.equals(order.getStatus())
                && !Order.STATUS_CONFIRMED.equals(order.getStatus())) {
            throw new BusinessException("Đơn đang giao hoặc đã kết thúc, vui lòng liên hệ shop để hủy", HttpStatus.BAD_REQUEST);
        }
        if (order.isStockDeducted()) {
            restoreStock(order);
            order.setStockDeducted(false);
            order.setNote(joinNote(order.getNote(), "Khách hủy sau thanh toán - cần hoàn tiền."));
        } else {
            releaseReservedStock(order);
        }
        order.setStatus(Order.STATUS_CANCELLED);
        return OrderResponse.from(orderRepository.save(order));
    }

    private void checkOwner(Order order, String username) {
        // Đơn vãng lai (không tài khoản) thì ai cầm mã đơn cũng được thao tác, đúng kiểu tra cứu đơn bằng mã.
        if (order.getUsername() == null && username == null) {
            return;
        }
        if (username == null || !username.equals(order.getUsername())) {
            throw new BusinessException("Bạn không có quyền thao tác đơn hàng này", HttpStatus.FORBIDDEN);
        }
    }

    private Order findOrder(String code) {
        return orderRepository.findById(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
    }

    /**
     * Giữ chỗ tồn kho khi đặt hàng: kiểm tra số lượng bán được
     * (quantity - reserved) rồi cộng vào reserved. Chưa trừ quantity.
     * Chạy trong transaction của create() nên hết hàng là rollback cả đơn.
     */
    private void reserveStock(String variantCode, int quantity, String productName) {
        Inventory inventory = inventoryRepository
                .findByWarehouseIdAndProductVariant_CodeForUpdate(CENTRAL_WAREHOUSE_ID, variantCode)
                .orElse(null);
        int available = inventory == null ? 0 : inventory.getQuantity() - inventory.getReservedQuantity();
        if (available < quantity) {
            String name = productName == null || productName.isBlank()
                    ? (variantCode == null ? "không xác định" : variantCode)
                    : productName;
            throw new BusinessException(
                    "Sản phẩm " + name + " chỉ còn " + Math.max(available, 0) + " sản phẩm có thể bán",
                    HttpStatus.BAD_REQUEST);
        }
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventoryRepository.save(inventory);
    }

    /**
     * Trả chỗ đã giữ khi hủy đơn hoặc xóa đơn đang xử lý.
     * Dùng max(0, ...) để tương thích đơn cũ tạo trước khi có cơ chế giữ chỗ.
     */
    private void releaseReservedStock(Order order) {
        for (OrderDetail detail : order.getDetails()) {
            inventoryRepository
                    .findByWarehouseIdAndProductVariant_CodeForUpdate(
                            CENTRAL_WAREHOUSE_ID, detail.getVariantCode())
                    .ifPresent(inventory -> {
                        inventory.setReservedQuantity(
                                Math.max(0, inventory.getReservedQuantity() - detail.getQuantity()));
                        inventoryRepository.save(inventory);
                    });
        }
    }

    /**
     * Xuất kho thực tế: trừ quantity và giải phóng chỗ giữ tương ứng.
     * Có cờ stockDeducted để dù đi qua CONFIRMED (VietQR) hay COMPLETED (COD)
     * thì mỗi đơn cũng chỉ trừ kho đúng một lần.
     */
    private void deductStockIfNeeded(Order order) {
        if (order.isStockDeducted()) {
            return;
        }
        for (OrderDetail detail : order.getDetails()) {
            Inventory inventory = inventoryRepository
                    .findByWarehouseIdAndProductVariant_CodeForUpdate(
                            CENTRAL_WAREHOUSE_ID, detail.getVariantCode())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy tồn kho của sản phẩm " + detail.getProductName()));
            if (inventory.getQuantity() < detail.getQuantity()) {
                throw new BusinessException(
                        "Tồn kho sản phẩm " + detail.getProductName() + " không đủ để hoàn thành đơn",
                        HttpStatus.BAD_REQUEST);
            }
            inventory.setQuantity(inventory.getQuantity() - detail.getQuantity());
            inventory.setReservedQuantity(
                    Math.max(0, inventory.getReservedQuantity() - detail.getQuantity()));
            inventoryRepository.save(inventory);
        }
        order.setStockDeducted(true);
    }

    /** Cộng trả tồn khi admin xóa đơn đã trừ kho (hiếm, để không mất tồn). */
    private void restoreStock(Order order) {
        for (OrderDetail detail : order.getDetails()) {
            inventoryRepository
                    .findByWarehouseIdAndProductVariant_CodeForUpdate(
                            CENTRAL_WAREHOUSE_ID, detail.getVariantCode())
                    .ifPresent(inventory -> {
                        inventory.setQuantity(inventory.getQuantity() + detail.getQuantity());
                        inventoryRepository.save(inventory);
                    });
        }
    }

    private String nextCode() {
        long count = orderRepository.count() + 1;
        String code = "DH" + count;
        while (orderRepository.existsById(code)) {
            count += 1;
            code = "DH" + count;
        }
        return code;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Tên hiển thị chuẩn: "Tên SP - Tên biến thể", dùng khi client không gửi productName. */
    private String resolveVariantName(ProductVariant variant) {
        String productName = variant.getProduct() == null ? "" : variant.getProduct().getName();
        if (variant.getName() == null || variant.getName().isBlank()) {
            return productName == null ? "" : productName;
        }
        return (productName == null || productName.isBlank())
                ? variant.getName().trim()
                : productName.trim() + " - " + variant.getName().trim();
    }

    private String joinNote(String current, String addition) {
        if (current == null || current.isBlank()) {
            return addition;
        }
        return current + " | " + addition;
    }

    private BigDecimal nonNegative(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }
}
