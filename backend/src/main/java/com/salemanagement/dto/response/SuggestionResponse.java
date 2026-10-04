package com.salemanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class SuggestionResponse {
    private String code;
    private String name;
    private String imageUrl;
}
