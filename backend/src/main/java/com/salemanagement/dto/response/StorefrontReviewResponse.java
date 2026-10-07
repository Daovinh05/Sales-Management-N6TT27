package com.salemanagement.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class StorefrontReviewResponse {
    private Long id;
    private String customerName;
    private Integer rating;
    private String content;
    private String reply;
    private LocalDateTime createdAt;
}
