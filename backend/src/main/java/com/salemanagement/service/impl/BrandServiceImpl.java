package com.salemanagement.service.impl;

import com.salemanagement.dto.request.BrandNameRequest;
import com.salemanagement.dto.request.BrandRequest;
import com.salemanagement.entity.Brand;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.BrandRepository;
import com.salemanagement.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Brand> list() {
        return brandRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional
    public Brand create(BrandRequest request) {
        String code = request.code().trim().toUpperCase();
        String name = request.name().trim();
        if (brandRepository.existsById(code)) {
            throw new BusinessException("Mã thương hiệu đã tồn tại", HttpStatus.CONFLICT);
        }
        if (brandRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Tên thương hiệu đã tồn tại", HttpStatus.CONFLICT);
        }

        Brand brand = new Brand();
        brand.setCode(code);
        brand.setName(name);
        return brandRepository.save(brand);
    }

    @Override
    @Transactional
    public Brand update(String code, BrandNameRequest request) {
        Brand brand = findBrand(code);
        String name = request.name().trim();
        if (brandRepository.existsByNameIgnoreCase(name)
                && !brand.getName().equalsIgnoreCase(name)) {
            throw new BusinessException("Tên thương hiệu đã tồn tại", HttpStatus.CONFLICT);
        }

        brand.setName(name);
        return brandRepository.save(brand);
    }

    @Override
    @Transactional
    public void delete(String code) {
        findBrand(code);
        brandRepository.deleteById(code);
    }

    private Brand findBrand(String code) {
        return brandRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu"));
    }
}