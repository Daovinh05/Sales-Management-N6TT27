package com.salemanagement.util;

import com.salemanagement.dto.request.ProductRequest;
import com.salemanagement.dto.request.ProductVariantRequest;
import com.salemanagement.dto.response.ProductResponse;
import com.salemanagement.dto.response.ProductVariantResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * Đọc/ghi file Excel cho Product và ProductVariant.
 * Template import (giống PHP): A=Mã SP, B=Tên SP, C=Mã danh mục, D=Mã thương hiệu, E=Mã nhà cung cấp.
 * File export: A-H gồm thêm tên danh mục/thương hiệu/NCC.
 */
public final class ExcelHelper {

    private ExcelHelper() {
    }

    public static String cellString(Cell cell) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            double value = cell.getNumericCellValue();
            if (value == Math.floor(value) && !Double.isInfinite(value)) {
                return String.valueOf((long) value);
            }
            return String.valueOf(value);
        }
        cell.setCellType(CellType.STRING);
        return cell.getStringCellValue() == null ? "" : cell.getStringCellValue().trim();
    }

    /** Parse sheet import sản phẩm: bỏ dòng 1 (tiêu đề), đọc cột A-E. Hỗ trợ cả .xls và .xlsx. */
    public static List<ParsedProductRow> parseProductRows(InputStream inputStream) throws IOException {
        List<ParsedProductRow> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }
                ProductRequest request = new ProductRequest();
                request.setCode(cellString(row.getCell(0)));
                request.setName(cellString(row.getCell(1)));
                String category = cellString(row.getCell(2));
                String brand = cellString(row.getCell(3));
                String supplier = cellString(row.getCell(4));
                request.setCategoryCode(category.isEmpty() ? null : category);
                request.setBrandCode(brand.isEmpty() ? null : brand);
                request.setSupplierCode(supplier.isEmpty() ? null : supplier);
                rows.add(new ParsedProductRow(i + 1, request));
            }
        }
        return rows;
    }

    /** Parse sheet import biến thể: A=Mã BT, B=Mã SP, C=Tên BT, D=Màu, E=RAM, F=Dung lượng, G=Giá, H=Tồn kho. Hỗ trợ cả .xls và .xlsx. */
    public static List<ParsedVariantRow> parseVariantRows(InputStream inputStream) throws IOException {
        List<ParsedVariantRow> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }
                ProductVariantRequest request = new ProductVariantRequest();
                request.setCode(cellString(row.getCell(0)));
                request.setProductCode(cellString(row.getCell(1)));
                request.setName(cellString(row.getCell(2)));
                request.setColor(cellString(row.getCell(3)));
                request.setRam(cellString(row.getCell(4)));
                request.setStorage(cellString(row.getCell(5)));
                String price = cellString(row.getCell(6));
                
                rows.add(new ParsedVariantRow(i + 1, request));
            }
        }
        return rows;
    }

    public static void writeProducts(List<ProductResponse> products, OutputStream outputStream) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("DanhSachSanPham");
            String[] headers = {"Mã sản phẩm", "Tên sản phẩm", "Hình ảnh biến thể", "Giá",
                    "Số lượng", "Tên danh mục", "Tên thương hiệu", "Tên nhà cung cấp"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }
            int rowIndex = 1;
            for (ProductResponse product : products) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(nullToEmpty(product.getCode()));
                row.createCell(1).setCellValue(nullToEmpty(product.getName()));
                row.createCell(2).setCellValue(nullToEmpty(product.getImageUrl()));
                row.createCell(3).setCellValue(product.getPrice() == null ? "" : product.getPrice().toPlainString());
                row.createCell(4).setCellValue(product.getStockQuantity() == null ? "" : String.valueOf(product.getStockQuantity()));
                row.createCell(5).setCellValue(nullToEmpty(product.getCategoryName()));
                row.createCell(6).setCellValue(nullToEmpty(product.getBrandName()));
                row.createCell(7).setCellValue(nullToEmpty(product.getSupplierName()));
            }
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(outputStream);
        }
    }

    public static void writeVariants(List<ProductVariantResponse> variants, OutputStream outputStream) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("DanhSachBienThe");
            String[] headers = {"Mã biến thể", "Mã sản phẩm", "Tên sản phẩm", "Tên biến thể",
                    "Hình ảnh", "Màu sắc", "RAM", "Dung lượng", "Giá", "Số lượng kho"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }
            int rowIndex = 1;
            for (ProductVariantResponse variant : variants) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(nullToEmpty(variant.getCode()));
                row.createCell(1).setCellValue(nullToEmpty(variant.getProductCode()));
                row.createCell(2).setCellValue(nullToEmpty(variant.getProductName()));
                row.createCell(3).setCellValue(nullToEmpty(variant.getName()));
                row.createCell(4).setCellValue(nullToEmpty(variant.getImageUrl()));
                row.createCell(5).setCellValue(nullToEmpty(variant.getColor()));
                row.createCell(6).setCellValue(nullToEmpty(variant.getRam()));
                row.createCell(7).setCellValue(nullToEmpty(variant.getStorage()));
                row.createCell(8).setCellValue(variant.getPrice() == null ? "" : variant.getPrice().toPlainString());
                row.createCell(9).setCellValue(variant.getStockQuantity() == null ? "" : String.valueOf(variant.getStockQuantity()));
            }
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(outputStream);
        }
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    public record ParsedProductRow(int rowNumber, ProductRequest request) {
    }

    public record ParsedVariantRow(int rowNumber, ProductVariantRequest request) {
    }
}
