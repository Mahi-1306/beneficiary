package com.example.beneficiary_system_v2.scheme;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
public class GovernmentSchemeSeedData {

    @Bean
    CommandLineRunner seedGovernmentSchemes(GovernmentSchemeRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            LocalDateTime seededAt = LocalDateTime.now();
            repository.save(GovernmentScheme.builder()
                    .schemeName("National Scholarship Scheme")
                    .category("Education")
                    .description("Financial support for eligible students pursuing studies after Class VIII.")
                    .benefits("Annual scholarship assistance for education-related expenses.")
                    .eligibility("Indian students studying in a recognized institution who meet the applicable family-income and academic requirements may apply. Applicants must provide valid identity, income, and student-status records.")
                    .documentsRequired("AADHAAR,INCOME_CERTIFICATE,STUDENT_CERTIFICATE")
                    .officialLink("https://scholarships.gov.in/")
                    .applicationLink("https://scholarships.gov.in/")
                    .state("All India")
                    .department("Ministry of Education")
                    .keywords("scholarship,student,education,income")
                    .status("OPEN")
                    .launchDate(LocalDate.of(2015, 1, 1))
                    .eligibilityScore(80)
                    .active(true)
                    .recommendationCount(0L)
                    .lastUpdated(seededAt)
                    .build());

            repository.save(GovernmentScheme.builder()
                    .schemeName("Pradhan Mantri Ujjwala Yojana")
                    .category("Social Welfare")
                    .description("Provides support for eligible households to obtain an LPG connection.")
                    .benefits("Deposit-free LPG connection support for eligible beneficiaries.")
                    .eligibility("Eligible adult women from qualifying households without an existing LPG connection may apply, subject to scheme verification.")
                    .documentsRequired("AADHAAR,RATION_CARD,BANK_ACCOUNT")
                    .officialLink("https://www.pmuy.gov.in/")
                    .applicationLink("https://www.pmuy.gov.in/")
                    .state("All India")
                    .department("Ministry of Petroleum and Natural Gas")
                    .keywords("lpg,gas,household,women")
                    .status("OPEN")
                    .launchDate(LocalDate.of(2016, 5, 1))
                    .eligibilityScore(75)
                    .active(true)
                    .recommendationCount(0L)
                    .lastUpdated(seededAt)
                    .build());

            repository.save(GovernmentScheme.builder()
                    .schemeName("Ayushman Bharat Pradhan Mantri Jan Arogya Yojana")
                    .category("Healthcare")
                    .description("Health assurance scheme for eligible families to access covered hospital care.")
                    .benefits("Cashless treatment coverage at empanelled hospitals, subject to scheme rules.")
                    .eligibility("Families identified under the applicable deprivation and occupational criteria may be eligible after beneficiary-record verification.")
                    .documentsRequired("AADHAAR,RATION_CARD,FAMILY_ID")
                    .officialLink("https://pmjay.gov.in/")
                    .applicationLink("https://beneficiary.nha.gov.in/")
                    .state("All India")
                    .department("National Health Authority")
                    .keywords("healthcare,insurance,hospital,family")
                    .status("OPEN")
                    .launchDate(LocalDate.of(2018, 9, 23))
                    .eligibilityScore(85)
                    .active(true)
                    .recommendationCount(0L)
                    .lastUpdated(seededAt)
                    .build());
        };
    }
}
