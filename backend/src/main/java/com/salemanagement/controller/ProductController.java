package com.salemanagement.controller;

import com.salemanagement.dto.request.ProductRequest;
import com.salemanagement.dto.request.ProductUpdateRequest;
import com.salemanagement.dto.response.ImportResult;
import com.salemanagement.dto.response.ProductResponse;
import com.salemanagement.service.ProductService;
import com.salemanagement.util.ExcelHelper;
import com.salemanagement.util.ExcelHelper.ParsedProductRow;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> list(
            @RequestParam(required = false, defaultValue = "") String code,
            @RequestParam(required = false, defaultValue = "") String name,
            @RequestParam(required = false) String format,
            HttpServletResponse response) throws IOException {
        List<ProductResponse> products = productService.list(code, name);
        if ("xlsx".equalsIgnoreCase(format)) {
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"DanhSachSanPham.xlsx\"");
            ExcelHelper.writeProducts(products, response.getOutputStream());
            response.flushBuffer();
            return null;
        }
        return products;
    }

    @GetMapping("/{code}")
    public ProductResponse getDetail(@PathVariable String code) {
        return productService.getDetail(code);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse update(@PathVariable String code, @Valid @RequestBody ProductUpdateRequest request) {
        return productService.update(code, request);
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String code) {
        productService.delete(code);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ImportResult importFile(@RequestParam("file") MultipartFile file) throws IOException {
        List<ParsedProductRow> rows;
        try (var inputStream = file.getInputStream()) {
            rows = ExcelHelper.parseProductRows(inputStream);
        }
        return productService.importRows(rows);
    }
}
