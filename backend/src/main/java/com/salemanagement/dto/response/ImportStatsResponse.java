package com.salemanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportStatsResponse {
    private long totalImports;
    private long pendingImports;
    private long approvedImports;
    private long rejectedImports;
}
