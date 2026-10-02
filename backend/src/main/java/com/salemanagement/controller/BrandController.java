package com.salemanagement.controller;

import com.salemanagement.entity.Brand;
import com.salemanagement.repository.BrandRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public List<Brand> list() {
        return brandRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Brand create(@Valid @RequestBody BrandRequest request) {
        String code = request.code().trim().toUpperCase();
        String name = request.name().trim();
        if (brandRepository.existsById(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã thương hiệu đã tồn tại");
        }
        if (brandRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên thương hiệu đã tồn tại");
        }
        Brand brand = new Brand();
        brand.setCode(code);
        brand.setName(name);
        return brandRepository.save(brand);
    }

    @PutMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public Brand update(@PathVariable String code, @Valid @RequestBody BrandNameRequest request) {
        Brand brand = brandRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thương hiệu"));
        String name = request.name().trim();
        if (brandRepository.existsByNameIgnoreCase(name)
                && !brand.getName().equalsIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên thương hiệu đã tồn tại");
        }
        brand.setName(name);
        return brandRepository.save(brand);
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String code) {
        if (!brandRepository.existsById(code)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thương hiệu");
        }
        brandRepository.deleteById(code);
    }

    public record BrandRequest(
            @NotBlank @Size(max = 20) String code,
            @NotBlank @Size(max = 100) String name) {
    }

    public record BrandNameRequest(@NotBlank @Size(max = 100) String name) {
    }
}