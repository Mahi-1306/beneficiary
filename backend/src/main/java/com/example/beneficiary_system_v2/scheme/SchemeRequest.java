package com.example.beneficiary_system_v2.scheme;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record SchemeRequest(
        @NotBlank @Size(max = 255) String schemeName,
        String category,
        String description,
        String benefits,
        String eligibility,
        String documentsRequired,
        String officialLink,
        String applicationLink,
        String state,
        String department,
        String keywords,
        String status,
        LocalDate launchDate,
        Integer eligibilityScore,
        Boolean active,
        Long recommendationCount
) {}
