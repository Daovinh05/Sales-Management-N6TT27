package com.salemanagement.service;

import com.salemanagement.dto.request.BrandNameRequest;
import com.salemanagement.dto.request.BrandRequest;
import com.salemanagement.entity.Brand;

import java.util.List;

public interface BrandService {
    List<Brand> list();

    Brand create(BrandRequest request);

    Brand update(String code, BrandNameRequest request);

    void delete(String code);
}