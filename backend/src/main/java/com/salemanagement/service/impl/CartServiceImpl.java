package com.salemanagement.service.impl;

import com.salemanagement.dto.request.CartAddRequest;
import com.salemanagement.dto.request.CartUpdateRequest;
import com.salemanagement.dto.response.CartItemResponse;
import com.salemanagement.dto.response.CartResponse;
import com.salemanagement.entity.Cart;
import com.salemanagement.entity.CartItem;
import com.salemanagement.entity.Product;
import com.salemanagement.entity.ProductVariant;
import com.salemanagement.entity.User;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.CartItemRepository;
import com.salemanagement.repository.CartRepository;
import com.salemanagement.repository.ProductVariantRepository;
import com.salemanagement.service.CartService;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;

    private static String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user).orElseGet(() -> {
            Cart cart = new Cart();
            cart.setUser(user);
            cart.setStatus(Cart.STATUS_ACTIVE);
            return cartRepository.save(cart);
        });
    }

    private ProductVariant requireVariant(String variantCode) {
        String code = normalizeCode(variantCode);
        if (code.isEmpty()) {
            throw new BusinessException("Vui lòng cung cấp mã biến thể", HttpStatus.BAD_REQUEST);
        }
        return variantRepository.findById(code)
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy biến thể", HttpStatus.NOT_FOUND));
    }

    private void checkStock(ProductVariant variant, int quantity) {
        int stock = variant.getStockQuantity() == null ? 0 : variant.getStockQuantity();
        if (quantity > stock) {
            throw new BusinessException(
                    "Số lượng vượt quá tồn kho (còn " + stock + ")", HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    private CartItemResponse toItemResponse(CartItem item) {
        ProductVariant variant = item.getVariant();
        Product product = variant.getProduct();
        BigDecimal price = variant.getPrice() == null ? BigDecimal.ZERO : variant.getPrice();
        BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
        return CartItemResponse.of(
                variant.getCode(),
                product == null ? null : product.getCode(),
                product == null ? null : product.getName(),
                variant.getName(),
                variant.getImageUrl(),
                variant.getColor(),
                variant.getRam(),
                variant.getStorage(),
                variant.getPrice(),
                variant.getStockQuantity(),
                item.getQuantity(),
                lineTotal);
    }

    private CartResponse collect(Cart cart) {
        List<CartItemResponse> items = new ArrayList<>();
        int totalQuantity = 0;
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cartItemRepository.findByCartOrderByIdAsc(cart)) {
            // Bỏ dòng có biến thể đã bị xóa, đúng PHP collectCartItems.
            if (item.getVariant() == null) {
                continue;
            }
            items.add(toItemResponse(item));
            totalQuantity += item.getQuantity();
            BigDecimal price = item.getVariant().getPrice() == null
                    ? BigDecimal.ZERO : item.getVariant().getPrice();
            subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        return CartResponse.of(items, items.size(), totalQuantity, subtotal);
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(User user) {
        // GET thuần đọc: chưa có giỏ thì trả rỗng, không INSERT trên connection read-only.
        return cartRepository.findByUser(user)
                .map(this::collect)
                .orElseGet(() -> CartResponse.of(List.of(), 0, 0, BigDecimal.ZERO));
    }

    @Override
    @Transactional
    public CartResponse addItem(User user, CartAddRequest request) {
        ProductVariant variant = requireVariant(request.getVariantCode());
        int quantity = request.getQuantity() == null ? 1 : request.getQuantity();
        checkStock(variant, quantity);
        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findByCartAndVariant(cart, variant).orElse(null);
        int existingQty = item == null ? 0 : item.getQuantity();
        checkStock(variant, existingQty + quantity);
        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setVariant(variant);
            item.setQuantity(quantity);
        } else {
            item.setQuantity(existingQty + quantity);
        }
        cartItemRepository.save(item);
        return collect(cart);
    }

    @Override
    @Transactional
    public CartResponse updateQuantity(User user, String variantCode, CartUpdateRequest request) {
        ProductVariant variant = requireVariant(variantCode);
        checkStock(variant, request.getQuantity());
        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findByCartAndVariant(cart, variant)
                .orElseThrow(() -> new BusinessException(
                        "Biến thể này chưa có trong giỏ hàng", HttpStatus.NOT_FOUND));
        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);
        return collect(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(User user, String variantCode) {
        ProductVariant variant = requireVariant(variantCode);
        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findByCartAndVariant(cart, variant)
                .orElseThrow(() -> new BusinessException(
                        "Không tìm thấy biến thể trong giỏ hàng", HttpStatus.NOT_FOUND));
        cartItemRepository.delete(item);
        return collect(cart);
    }

    @Override
    @Transactional
    public void clear(User user) {
        cartRepository.findByUser(user).ifPresent(cartItemRepository::deleteByCart);
    }
}
