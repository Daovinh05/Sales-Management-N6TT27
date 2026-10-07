package com.salemanagement.service.impl.warehouse;

import com.salemanagement.dto.response.ImportReceiptDetailResponse;
import com.salemanagement.dto.response.ImportReceiptSummaryResponse;
import com.salemanagement.dto.response.PageResponse;
import com.salemanagement.dto.response.StaffResponse;
import com.salemanagement.dto.response.WarehouseResponse;
import com.salemanagement.entity.ImportDetail;
import com.salemanagement.entity.ImportReceipt;
import com.salemanagement.entity.Warehouse;
import com.salemanagement.enums.ERole;
import com.salemanagement.exception.ResourceNotFoundException;
import com.salemanagement.repository.ImportReceiptRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.repository.WarehouseRepository;
import com.salemanagement.service.warehouse.WarehouseAdminService;
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
public class WarehouseAdminServiceImpl implements WarehouseAdminService {

    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final ImportReceiptRepository importReceiptRepository;
    private final com.salemanagement.repository.InventoryRepository inventoryRepository;

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouseConfig(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho"));
        return WarehouseResponse.from(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffResponse> getWarehouseStaffs() {
        return userRepository.findByRoleName(ERole.ROLE_WAREHOUSE_STAFF).stream()
                .map(StaffResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ImportReceiptSummaryResponse> getImportHistory(int page, int size) {
        Page<ImportReceipt> pageResult = importReceiptRepository.findAllWithDetails(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<ImportReceiptSummaryResponse> content = pageResult.getContent().stream()
                .map(receipt -> ImportReceiptSummaryResponse.builder()
                        .id(receipt.getId())
                        .createdByName(receipt.getCreatedBy() != null ? receipt.getCreatedBy().getFullName() : null)
                        .supplierName(receipt.getSupplier() != null ? receipt.getSupplier().getName() : null)
                        .totalAmount(receipt.getTotalAmount())
                        .createdAt(receipt.getCreatedAt())
                        .note(receipt.getNote())
                        .status(receipt.getStatus().name())
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

    @Override
    @Transactional(readOnly = true)
    public ImportReceiptDetailResponse getImportDetail(Long id) {
        ImportReceipt receipt = importReceiptRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập"));

        List<ImportReceiptDetailResponse.Item> items = receipt.getDetails().stream()
                .map(detail -> ImportReceiptDetailResponse.Item.builder()
                        .variantCode(detail.getProductVariant() != null ? detail.getProductVariant().getCode() : null)
                        .variantName(detail.getProductVariant() != null ? detail.getProductVariant().getName() : null)
                        .quantity(detail.getQuantity())
                        .unitPrice(detail.getUnitPrice())
                        .subTotal(detail.getUnitPrice().multiply(new BigDecimal(detail.getQuantity())))
                        .build())
                .collect(Collectors.toList());

        return ImportReceiptDetailResponse.builder()
                .id(receipt.getId())
                .createdByName(receipt.getCreatedBy() != null ? receipt.getCreatedBy().getFullName() : null)
                .supplierName(receipt.getSupplier() != null ? receipt.getSupplier().getName() : null)
                .totalAmount(receipt.getTotalAmount())
                .createdAt(receipt.getCreatedAt())
                .note(receipt.getNote())
                .status(receipt.getStatus().name())
                .details(items)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateImportStatus(Long id, com.salemanagement.dto.request.UpdateImportStatusRequest request) {
        ImportReceipt receipt = importReceiptRepository.findByIdWithFullDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập"));

        if (receipt.getStatus() != com.salemanagement.enums.EImportStatus.PENDING) {
            throw new IllegalArgumentException("Phiếu nhập đã được xử lý (Duyệt hoặc Từ chối) trước đó");
        }

        com.salemanagement.enums.EImportStatus newStatus = com.salemanagement.enums.EImportStatus.valueOf(request.getStatus().toUpperCase());
        receipt.setStatus(newStatus);

        if (newStatus == com.salemanagement.enums.EImportStatus.APPROVED) {
            // Update inventory
            // Fixed Warehouse ID = 1 for now
            Warehouse warehouse = warehouseRepository.findById(1L)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho"));

            for (ImportDetail detail : receipt.getDetails()) {
                com.salemanagement.entity.ProductVariant variant = detail.getProductVariant();
                com.salemanagement.entity.Inventory inventory = inventoryRepository.findByWarehouseIdAndProductVariant_Code(warehouse.getId(), variant.getCode())
                        .orElse(null);

                if (inventory != null) {
                    inventory.setQuantity(inventory.getQuantity() + detail.getQuantity());
                    inventoryRepository.save(inventory);
                } else {
                    inventory = com.salemanagement.entity.Inventory.builder()
                            .warehouse(warehouse)
                            .productVariant(variant)
                            .quantity(detail.getQuantity())
                            .reservedQuantity(0)
                            .build();
                    inventoryRepository.save(inventory);
                }
            }
        }
        importReceiptRepository.save(receipt);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WarehouseResponse updateWarehouse(Long id, com.salemanagement.dto.request.UpdateWarehouseInfoRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kho"));
        
        warehouse.setName(request.getName());
        warehouse.setAddress(request.getAddress());
        warehouse.setPhone(request.getPhone());
        
        warehouseRepository.save(warehouse);
        return WarehouseResponse.from(warehouse);
    }
}
