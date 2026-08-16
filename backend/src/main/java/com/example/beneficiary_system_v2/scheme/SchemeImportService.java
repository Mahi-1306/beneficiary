package com.example.beneficiary_system_v2.scheme;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opencsv.CSVReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Confirmed column mapping from updated_data.csv:
 *
 *   scheme_name     → schemeName  (unique key for upsert)
 *   schemeCategory  → category
 *   details         → description
 *   benefits        → benefits
 *   eligibility     → eligibility
 *   documents       → documentsRequired  (raw text, stored as-is)
 *   tags            → keywords
 *   level           → state  ("Central" → "All India", "State" → "State-level")
 *   application     → appended to description as "How to Apply: ..."
 *   slug            → skipped (internal identifier, no matching field)
 *   (empty col 10)  → skipped
 */
@Service
public class SchemeImportService {

    private static final Logger log = LoggerFactory.getLogger(SchemeImportService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GovernmentSchemeRepository repository;

    public SchemeImportService(GovernmentSchemeRepository repository) {
        this.repository = repository;
    }

    public ImportResult importFromFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();

        if (filename.endsWith(".json") || contentType.contains("json")) {
            return importJson(file);
        }
        return importCsv(file);
    }

    // -------------------------------------------------------------------------
    // CSV import
    // -------------------------------------------------------------------------
    private ImportResult importCsv(MultipartFile file) throws Exception {
        int imported = 0, updated = 0, skipped = 0;
        List<ImportResult.ImportError> errors = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] headers = reader.readNext();
            if (headers == null) return new ImportResult(0, 0, 0, errors);

            for (int i = 0; i < headers.length; i++) headers[i] = headers[i].trim();

            String[] row;
            int rowNum = 1;
            while ((row = reader.readNext()) != null) {
                rowNum++;
                try {
                    Map<String, String> record = new HashMap<>();
                    for (int i = 0; i < headers.length && i < row.length; i++) {
                        record.put(headers[i], row[i]);
                    }
                    boolean wasNew = upsert(record);
                    if (wasNew) imported++; else updated++;
                } catch (SkipRecordException e) {
                    skipped++;
                    errors.add(new ImportResult.ImportError(rowNum, e.getMessage()));
                    log.warn("Skipping row {}: {}", rowNum, e.getMessage());
                } catch (Exception e) {
                    skipped++;
                    errors.add(new ImportResult.ImportError(rowNum, e.getMessage()));
                    log.warn("Error on row {}: {}", rowNum, e.getMessage());
                }
            }
        }
        return new ImportResult(imported, updated, skipped, errors);
    }

    // -------------------------------------------------------------------------
    // JSON import
    // -------------------------------------------------------------------------
    private ImportResult importJson(MultipartFile file) throws Exception {
        int imported = 0, updated = 0, skipped = 0;
        List<ImportResult.ImportError> errors = new ArrayList<>();

        JsonNode root = MAPPER.readTree(file.getInputStream());
        JsonNode array = root.isArray() ? root : findFirstArray(root);
        if (array == null) return new ImportResult(0, 0, 0, errors);

        int rowNum = 0;
        for (JsonNode node : array) {
            rowNum++;
            try {
                Map<String, String> record = new HashMap<>();
                node.fields().forEachRemaining(e -> record.put(e.getKey(), e.getValue().asText("")));
                boolean wasNew = upsert(record);
                if (wasNew) imported++; else updated++;
            } catch (SkipRecordException e) {
                skipped++;
                errors.add(new ImportResult.ImportError(rowNum, e.getMessage()));
                log.warn("Skipping record {}: {}", rowNum, e.getMessage());
            } catch (Exception e) {
                skipped++;
                errors.add(new ImportResult.ImportError(rowNum, e.getMessage()));
                log.warn("Error on record {}: {}", rowNum, e.getMessage());
            }
        }
        return new ImportResult(imported, updated, skipped, errors);
    }

    // -------------------------------------------------------------------------
    // Field mapping — confirmed against updated_data.csv
    // -------------------------------------------------------------------------
    private boolean upsert(Map<String, String> record) {
        String schemeName = str(record, "scheme_name");
        if (schemeName == null || schemeName.isBlank()) {
            throw new SkipRecordException("scheme_name is blank — cannot upsert without a unique name");
        }

        String details = str(record, "details");
        String application = str(record, "application");
        String description = details != null ? details : "";
        String applicationText = application != null && !application.isBlank() ? application : null;

        String level = str(record, "level");
        String levelValue = (level != null && !level.isBlank()) ? level.trim() : "";
        String normalizedLevel = levelValue.isBlank() ? "State" : levelValue;

        boolean isNew = !repository.existsBySchemeNameIgnoreCase(schemeName);
        GovernmentScheme scheme = repository.findBySchemeNameIgnoreCase(schemeName);
        if (scheme == null) {
            scheme = GovernmentScheme.builder().build();
        }

        scheme.setSchemeName(schemeName);
        scheme.setSlug(str(record, "slug"));
        scheme.setCategory(str(record, "schemeCategory"));
        scheme.setLevel(normalizedLevel);
        scheme.setDescription(description.isBlank() ? null : description);
        scheme.setBenefits(str(record, "benefits"));
        scheme.setEligibility(str(record, "eligibility"));
        scheme.setDocumentsRequired(str(record, "documents"));
        scheme.setApplication(applicationText);
        scheme.setKeywords(str(record, "tags"));
        scheme.setState(levelValue.equalsIgnoreCase("Central") ? "All India" : "State");
        scheme.setStatus("OPEN");
        scheme.setActive(true);
        scheme.setRecommendationCount(scheme.getRecommendationCount() != null ? scheme.getRecommendationCount() : 0L);
        scheme.setLastUpdated(LocalDateTime.now());
        scheme.setSource("IMPORTED");
        scheme.setVerified(false);

        if (isNew) {
            scheme.setOfficialLink(null);
            scheme.setApplicationLink(null);
            scheme.setDepartment(null);
            scheme.setLaunchDate(null);
            scheme.setEligibilityScore(null);
        }

        repository.save(scheme);
        return isNew;
    }

    private String str(Map<String, String> record, String key) {
        String val = record.get(key);
        return (val != null && !val.isBlank()) ? val.trim() : null;
    }

    private JsonNode findFirstArray(JsonNode node) {
        var it = node.elements();
        while (it.hasNext()) {
            JsonNode child = it.next();
            if (child.isArray()) return child;
        }
        return null;
    }

    static class SkipRecordException extends RuntimeException {
        SkipRecordException(String msg) { super(msg); }
    }
}
