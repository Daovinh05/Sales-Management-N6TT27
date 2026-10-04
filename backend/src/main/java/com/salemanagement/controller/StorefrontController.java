package com.salemanagement.controller;

import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.dto.response.StorefrontDetailResponse;
import com.salemanagement.dto.response.StorefrontProductResponse;
import com.salemanagement.dto.response.SuggestionResponse;
import com.salemanagement.service.StorefrontService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/storefront")
@RequiredArgsConstructor
public class StorefrontController {

    private final StorefrontService storefrontService;

    @GetMapping("/products")
    public PageResponse<StorefrontProductResponse> listProducts(
            @RequestParam(required = false, defaultValue = "") String category,
            @RequestParam(required = false, defaultValue = "") String brand,
            @RequestParam(required = false, defaultValue = "tat-ca") String price,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "8") int size) {
        return storefrontService.listProducts(category, brand, price, search, page, size);
    }

    @GetMapping("/products/{code}")
    public StorefrontDetailResponse getDetail(@PathVariable String code) {
        return storefrontService.getDetail(code);
    }

    @GetMapping("/suggestions")
    public List<SuggestionResponse> suggest(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "8") int limit) {
        return storefrontService.suggest(q, limit);
    }
}
