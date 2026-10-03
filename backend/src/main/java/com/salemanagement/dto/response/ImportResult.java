package com.salemanagement.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class ImportResult {
    private int created;
    private int skippedEmpty;
    private int duplicatedCount;
    private List<String> duplicatedCodes;
    private int failedCount;
    private List<RowError> failedRows;

    @Getter
    @AllArgsConstructor(staticName = "of")
    public static class RowError {
        private int row;
        private String code;
        private String reason;
    }
}
