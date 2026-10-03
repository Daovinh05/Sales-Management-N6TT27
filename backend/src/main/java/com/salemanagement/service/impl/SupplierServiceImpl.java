package com.salemanagement.service.impl;

import com.salemanagement.dto.request.SupplierRequest;
import com.salemanagement.dto.request.SupplierUpdateRequest;
import com.salemanagement.dto.response.SupplierResponse;
import com.salemanagement.entity.Supplier;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.SupplierRepository;
import com.salemanagement.service.SupplierService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> list() {
        return supplierRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(SupplierResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public SupplierResponse create(SupplierRequest request) {
        String code = request.code().trim().toUpperCase();
        String name = request.name().trim();
        if (supplierRepository.existsById(code)) {
            throw new BusinessException("Mã nhà cung cấp đã tồn tại", HttpStatus.CONFLICT);
        }
        if (supplierRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("Tên nhà cung cấp đã tồn tại", HttpStatus.CONFLICT);
        }

        Supplier supplier = new Supplier();
        supplier.setCode(code);
        supplier.setName(name);
        supplier.setAddress(normalize(request.address()));
        supplier.setPhone(normalize(request.phone()));
        return SupplierResponse.from(supplierRepository.save(supplier));
    }

    @Override
    @Transactional
    public SupplierResponse update(String code, SupplierUpdateRequest request) {
        Supplier supplier = findSupplier(code);
        String name = request.name().trim();
        if (supplierRepository.existsByNameIgnoreCase(name)
                && !supplier.getName().equalsIgnoreCase(name)) {
            throw new BusinessException("Tên nhà cung cấp đã tồn tại", HttpStatus.CONFLICT);
        }

        supplier.setName(name);
        supplier.setAddress(normalize(request.address()));
        supplier.setPhone(normalize(request.phone()));
        return SupplierResponse.from(supplierRepository.save(supplier));
    }

    @Override
    @Transactional
    public void delete(String code) {
        findSupplier(code);
        supplierRepository.deleteById(code.trim().toUpperCase());
    }

    private Supplier findSupplier(String code) {
        return supplierRepository.findById(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}