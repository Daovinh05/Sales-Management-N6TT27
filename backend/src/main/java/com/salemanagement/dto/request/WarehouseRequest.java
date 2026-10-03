package com.salemanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseRequest {

    @NotBlank(message = "Tên kho không được để trống")
    @Size(max = 150, message = "Tên kho tối đa 150 ký tự")
    private String name;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String address;

    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "Trạng thái chỉ có thể là ACTIVE hoặc INACTIVE")
    private String status;
}
