package com.salemanagement.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class StorefrontDetailResponse {
    private String code;
    private String name;
    private String categoryCode;
    private String categoryName;
    private String brandCode;
    private String brandName;
    private String supplierCode;
    private String supplierName;
    private List<ProductVariantResponse> variants;
    private List<StorefrontProductResponse> similar;
}
