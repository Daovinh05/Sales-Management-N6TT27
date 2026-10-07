package com.salemanagement.controller;

import com.salemanagement.dto.request.CartAddRequest;
import com.salemanagement.dto.request.CartUpdateRequest;
import com.salemanagement.dto.response.CartResponse;
import com.salemanagement.security.CustomUserDetails;
import com.salemanagement.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart(@AuthenticationPrincipal CustomUserDetails principal) {
        return cartService.getCart(principal.getUser());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CartResponse addItem(@AuthenticationPrincipal CustomUserDetails principal,
                                @Valid @RequestBody CartAddRequest request) {
        return cartService.addItem(principal.getUser(), request);
    }

    @PutMapping("/{variantCode}")
    public CartResponse updateQuantity(@AuthenticationPrincipal CustomUserDetails principal,
                                       @PathVariable String variantCode,
                                       @Valid @RequestBody CartUpdateRequest request) {
        return cartService.updateQuantity(principal.getUser(), variantCode, request);
    }

    @DeleteMapping("/{variantCode}")
    public CartResponse removeItem(@AuthenticationPrincipal CustomUserDetails principal,
                                   @PathVariable String variantCode) {
        return cartService.removeItem(principal.getUser(), variantCode);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal CustomUserDetails principal) {
        cartService.clear(principal.getUser());
    }
}
