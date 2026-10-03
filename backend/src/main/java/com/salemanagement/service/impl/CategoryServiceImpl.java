package com.salemanagement.service.impl;

import com.salemanagement.dto.request.CategoryNameRequest;
import com.salemanagement.dto.request.CategoryRequest;
import com.salemanagement.dto.response.CategoryResponse;
import com.salemanagement.entity.Category;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.CategoryRepository;
import com.salemanagement.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return categoryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String code = request.code().trim().toUpperCase();
        String name = request.name().trim();
        if (categoryRepository.existsById(code)) {
            throw new BusinessException("Mã danh mục đã tồn tại", HttpStatus.CONFLICT);
        }
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Tên danh mục đã tồn tại", HttpStatus.CONFLICT);
        }

        Category category = new Category();
        category.setCode(code);
        category.setName(name);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryResponse update(String code, CategoryNameRequest request) {
        Category category = findCategory(code);
        String name = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)
                && !category.getName().equalsIgnoreCase(name)) {
            throw new BusinessException("Tên danh mục đã tồn tại", HttpStatus.CONFLICT);
        }

        category.setName(name);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void delete(String code) {
        findCategory(code);
        categoryRepository.deleteById(code);
    }

    private Category findCategory(String code) {
        return categoryRepository.findById(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
    }
}