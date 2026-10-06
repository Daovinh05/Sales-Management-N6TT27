package com.salemanagement.service.impl;

import com.salemanagement.dto.request.ImportReceiptRequest;
import com.salemanagement.dto.response.ImportReceiptDetailResponse;
import com.salemanagement.dto.response.ImportReceiptSummaryResponse;
import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.entity.*;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.*;
import com.salemanagement.service.WarehouseStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseStaffServiceImpl implements WarehouseStaffService {

    private final ImportReceiptRepository importReceiptRepository;
    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ImportReceiptDetailResponse createImport(ImportReceiptRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        Supplier supplier = supplierRepository.findById(request.getSupplierCode())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp"));

        // Fixed Warehouse ID = 1 for now
        Warehouse warehouse = warehouseRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho"));

        ImportReceipt receipt = ImportReceipt.builder()
                .createdBy(user)
                .supplier(supplier)
                .note(request.getNote())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (ImportReceiptRequest.ItemRequest itemReq : request.getDetails()) {
            ProductVariant variant = productVariantRepository.findById(itemReq.getVariantCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + itemReq.getVariantCode()));

            ImportDetail detail = ImportDetail.builder()
                    .importReceipt(receipt)
                    .productVariant(variant)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getImportPrice())
                    .build();

            receipt.getDetails().add(detail);
            
            BigDecimal subTotal = itemReq.getImportPrice().multiply(new BigDecimal(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subTotal);

            // Cập nhật Inventory
            Inventory inventory = inventoryRepository.findByWarehouseIdAndProductVariant_Code(warehouse.getId(), variant.getCode())
                    .orElse(null);

            if (inventory != null) {
                inventory.setQuantity(inventory.getQuantity() + itemReq.getQuantity());
                inventoryRepository.save(inventory);
            } else {
                inventory = Inventory.builder()
                        .warehouse(warehouse)
                        .productVariant(variant)
                        .quantity(itemReq.getQuantity())
                        .reservedQuantity(0)
                        .build();
                inventoryRepository.save(inventory);
            }
        }

        receipt.setTotalAmount(totalAmount);
        ImportReceipt saved = importReceiptRepository.save(receipt);

        List<ImportReceiptDetailResponse.Item> items = saved.getDetails().stream()
                .map(d -> ImportReceiptDetailResponse.Item.builder()
                        .variantCode(d.getProductVariant().getCode())
                        .variantName(d.getProductVariant().getName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .subTotal(d.getUnitPrice().multiply(new BigDecimal(d.getQuantity())))
                        .build())
                .collect(Collectors.toList());

        return ImportReceiptDetailResponse.builder()
                .id(saved.getId())
                .createdByName(saved.getCreatedBy().getFullName())
                .supplierName(saved.getSupplier().getName())
                .totalAmount(saved.getTotalAmount())
                .createdAt(saved.getCreatedAt())
                .note(saved.getNote())
                .details(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ImportReceiptSummaryResponse> getMyImports(String username, int page, int size) {
        Page<ImportReceipt> pageResult = importReceiptRepository.findByCreatedByUsernameWithDetails(
                username, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<ImportReceiptSummaryResponse> content = pageResult.getContent().stream()
                .map(receipt -> ImportReceiptSummaryResponse.builder()
                        .id(receipt.getId())
                        .createdByName(receipt.getCreatedBy() != null ? receipt.getCreatedBy().getFullName() : null)
                        .supplierName(receipt.getSupplier() != null ? receipt.getSupplier().getName() : null)
                        .totalAmount(receipt.getTotalAmount())
                        .createdAt(receipt.getCreatedAt())
                        .note(receipt.getNote())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.of(
                content,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }
}
