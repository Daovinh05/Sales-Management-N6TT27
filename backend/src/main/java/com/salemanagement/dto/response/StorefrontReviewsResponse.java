package com.salemanagement.dto.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class StorefrontReviewsResponse {
    private double average;
    private long total;
    private List<StarBucket> distribution;
    private List<StorefrontReviewResponse> reviews;

    @Getter
    @AllArgsConstructor(staticName = "of")
    public static class StarBucket {
        private int stars;
        private long count;
        private double percent;
    }
}
