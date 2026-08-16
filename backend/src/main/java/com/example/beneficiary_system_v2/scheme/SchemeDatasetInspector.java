package com.example.beneficiary_system_v2.scheme;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;
import org.springframework.stereotype.Component;

import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Run this against your downloaded dataset file to discover its real column/field names
 * before writing any mapping code.
 *
 * Usage (from IDE main method or CLI):
 *   SchemeDatasetInspector.inspect("path/to/your/file.csv");
 *   SchemeDatasetInspector.inspect("path/to/your/file.json");
 *
 * Output format:
 *   === COLUMNS (N total) ===
 *   [0] column_name_1
 *   [1] column_name_2
 *   ...
 *
 *   === RECORD 1 ===
 *   column_name_1 = "raw value"
 *   column_name_2 = "raw value"
 *   ...
 */
@Component
public class SchemeDatasetInspector {

    private static final int PREVIEW_ROWS = 5;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.err.println("Usage: SchemeDatasetInspector <path-to-file.csv|json>");
            System.exit(1);
        }
        inspect(args[0]);
    }

    public static void inspect(String filePath) throws IOException {
        String lower = filePath.toLowerCase();
        if (lower.endsWith(".json")) {
            inspectJson(filePath);
        } else {
            inspectCsv(filePath);
        }
    }

    private static void inspectCsv(String filePath) throws IOException {
        try (CSVReader reader = new CSVReader(new FileReader(filePath))) {
            String[] headers;
            try {
                headers = reader.readNext();
            } catch (com.opencsv.exceptions.CsvValidationException e) {
                throw new IOException("CSV header parse error: " + e.getMessage(), e);
            }
            if (headers == null) {
                System.out.println("File is empty.");
                return;
            }

            System.out.println("\n=== COLUMNS (" + headers.length + " total) ===");
            for (int i = 0; i < headers.length; i++) {
                System.out.printf("[%d] %s%n", i, headers[i].trim());
            }

            int rowNum = 0;
            String[] row;
            try {
                while ((row = reader.readNext()) != null && rowNum < PREVIEW_ROWS) {
                    rowNum++;
                    System.out.println("\n=== RECORD " + rowNum + " ===");
                    for (int i = 0; i < headers.length; i++) {
                        String value = (i < row.length) ? row[i] : "<missing>";
                        System.out.printf("  %-40s = \"%s\"%n", headers[i].trim(), value);
                    }
                }
            } catch (com.opencsv.exceptions.CsvValidationException e) {
                throw new IOException("CSV row parse error: " + e.getMessage(), e);
            }
            System.out.println("\n=== END OF PREVIEW ===");
        }
    }

    private static void inspectJson(String filePath) throws IOException {
        JsonNode root = MAPPER.readTree(Path.of(filePath).toFile());

        // Support both a top-level array and an object wrapping an array
        JsonNode array = root.isArray() ? root : findFirstArray(root);
        if (array == null || !array.isArray() || array.isEmpty()) {
            System.out.println("No JSON array found in file. Root node type: " + root.getNodeType());
            return;
        }

        // Collect all keys from first PREVIEW_ROWS records (union, in case keys vary)
        List<String> keys = new ArrayList<>();
        int count = 0;
        for (JsonNode record : array) {
            if (count >= PREVIEW_ROWS) break;
            record.fieldNames().forEachRemaining(k -> { if (!keys.contains(k)) keys.add(k); });
            count++;
        }

        System.out.println("\n=== COLUMNS (" + keys.size() + " total) ===");
        for (int i = 0; i < keys.size(); i++) {
            System.out.printf("[%d] %s%n", i, keys.get(i));
        }

        count = 0;
        for (JsonNode record : array) {
            if (count >= PREVIEW_ROWS) break;
            count++;
            System.out.println("\n=== RECORD " + count + " ===");
            for (String key : keys) {
                JsonNode val = record.get(key);
                System.out.printf("  %-40s = \"%s\"%n", key, val == null ? "<missing>" : val.asText());
            }
        }
        System.out.println("\n=== END OF PREVIEW ===");
    }

    private static JsonNode findFirstArray(JsonNode node) {
        Iterator<JsonNode> fields = node.elements();
        while (fields.hasNext()) {
            JsonNode child = fields.next();
            if (child.isArray()) return child;
        }
        return null;
    }
}
