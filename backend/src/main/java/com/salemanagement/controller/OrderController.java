package com.salemanagement.controller;

import com.salemanagement.dto.request.OrderRequest;
import com.salemanagement.dto.request.OrderStatusRequest;
import com.salemanagement.dto.response.OrderResponse;
import com.salemanagement.security.CustomUserDetails;
import com.salemanagement.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderResponse> list(
            @RequestParam(required = false, defaultValue = "") String code,
            @RequestParam(required = false, defaultValue = "") String customer) {
        return orderService.list(code, customer);
    }

    @GetMapping("/mine")
    public List<OrderResponse> myOrders(@AuthenticationPrincipal CustomUserDetails principal) {
        return orderService.myOrders(principal.getUsername());
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse detail(@PathVariable String code) {
        return orderService.detail(code);
    }

    @GetMapping("/{code}/detail")
    public OrderResponse ownerDetail(
            @PathVariable String code,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return orderService.ownerDetail(code, principal == null ? null : principal.getUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(
            @Valid @RequestBody OrderRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return orderService.create(request, principal == null ? null : principal.getUsername());
    }

    @PatchMapping("/{code}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse updateStatus(
            @PathVariable String code,
            @Valid @RequestBody OrderStatusRequest request) {
        return orderService.updateStatus(code, request.status());
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String code) {
        orderService.delete(code);
    }
}
