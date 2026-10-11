package com.salemanagement.controller;

import com.salemanagement.dto.request.ProductVariantRequest;
import com.salemanagement.dto.request.ProductVariantUpdateRequest;
import com.salemanagement.dto.response.ImportResult;
import com.salemanagement.dto.response.ProductVariantResponse;
import com.salemanagement.service.ProductVariantService;
import com.salemanagement.util.ExcelHelper;
import com.salemanagement.util.ExcelHelper.ParsedVariantRow;
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
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/variants")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService variantService;

    @GetMapping
    public List<ProductVariantResponse> list(
            @RequestParam(required = false, defaultValue = "") String code,
            @RequestParam(required = false, defaultValue = "") String name,
            @RequestParam(required = false) String productCode,
            @RequestParam(required = false) String format,
            HttpServletResponse response) throws IOException {
        List<ProductVariantResponse> variants = (productCode == null || productCode.isBlank())
                ? variantService.list(code, name)
                : variantService.listByProduct(productCode);
        if ("xlsx".equalsIgnoreCase(format)) {
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"DanhSachBienThe.xlsx\"");
            ExcelHelper.writeVariants(variants, response.getOutputStream());
            response.flushBuffer();
            return null;
        }
        return variants;
    }

    @GetMapping("/paginated")
    public com.salemanagement.dto.response.PageResponse<ProductVariantResponse> getVariantsPaginated(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return variantService.getVariantsPaginated(keyword, page, size);
    }

    @GetMapping("/{code}")
    public ProductVariantResponse getDetail(@PathVariable String code) {
        return variantService.getDetail(code);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ProductVariantResponse create(
            @Valid @ModelAttribute ProductVariantRequest request,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return variantService.create(request, image);
    }

    @PutMapping(value = "/{code}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ProductVariantResponse update(
            @PathVariable String code,
            @Valid @ModelAttribute ProductVariantUpdateRequest request,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return variantService.update(code, request, image);
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String code) {
        variantService.delete(code);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ImportResult importFile(@RequestParam("file") MultipartFile file) throws IOException {
        List<ParsedVariantRow> rows;
        try (var inputStream = file.getInputStream()) {
            rows = ExcelHelper.parseVariantRows(inputStream);
        }
        return variantService.importRows(rows);
    }
}
