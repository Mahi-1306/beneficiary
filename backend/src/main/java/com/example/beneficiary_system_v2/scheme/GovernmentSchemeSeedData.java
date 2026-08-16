package com.example.beneficiary_system_v2.scheme;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
public class GovernmentSchemeSeedData {

    private static final Logger log = LoggerFactory.getLogger(GovernmentSchemeSeedData.class);

    @Bean
    CommandLineRunner seedGovernmentSchemes(GovernmentSchemeRepository repository, SchemeImportService importService) {
        return args -> {
            ClassPathResource csv = new ClassPathResource("updated_data.csv");
            if (!csv.exists()) {
                log.warn("No dataset file found at src/main/resources/updated_data.csv. Skipping automatic scheme import.");
                return;
            }

            if (repository.countBySource("IMPORTED") > 0) {
                log.info("CSV-backed schemes already imported; skipping duplicate import.");
                return;
            }

            if (repository.count() > 0) {
                log.warn("Existing non-imported scheme rows detected; clearing them before importing dataset.");
                repository.deleteAll();
            }

            try {
                MultipartFile file = new ClassPathMultipartFile(csv);
                ImportResult result = importService.importFromFile(file);
                log.info("Auto-imported dataset: imported={}, updated={}, skipped={}, errors={}",
                        result.imported(), result.updated(), result.skipped(), result.errors().size());
            } catch (Exception e) {
                log.error("Dataset auto-import failed for updated_data.csv: {}", e.getMessage(), e);
                throw e;
            }
        };
    }
}
