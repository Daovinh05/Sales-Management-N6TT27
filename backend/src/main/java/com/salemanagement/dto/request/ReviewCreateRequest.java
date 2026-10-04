package com.salemanagement.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewCreateRequest {
    @NotNull(message = "Vui lòng chọn số sao")
    @Min(value = 1, message = "Số sao tối thiểu là 1")
    @Max(value = 5, message = "Số sao tối đa là 5")
    private Integer rating;

    @NotBlank(message = "Vui lòng nhập nội dung đánh giá")
    @Size(max = 2000, message = "Nội dung tối đa 2000 ký tự")
    private String content;
}
