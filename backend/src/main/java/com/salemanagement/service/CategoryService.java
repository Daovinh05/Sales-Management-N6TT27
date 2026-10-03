package com.salemanagement.service;

import com.salemanagement.dto.request.CategoryNameRequest;
import com.salemanagement.dto.request.CategoryRequest;
import com.salemanagement.dto.response.CategoryResponse;
import java.util.List;

public interface CategoryService {

    List<CategoryResponse> list();

    CategoryResponse create(CategoryRequest request);

    CategoryResponse update(String code, CategoryNameRequest request);

    void delete(String code);
}