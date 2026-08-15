package com.example.beneficiary_system_v2.ai;

import java.math.BigDecimal;
/**
 * Extracted beneficiary attributes. {@code availableDocuments} is a comma-delimited list of
 * {@link com.example.beneficiary_system_v2.document.DocumentClassification} names.
 */
public record BeneficiaryData(
        String fullName,
        String aadhaarNumber,
        String dateOfBirth,
        String gender,
        String address,
        String state,
        BigDecimal annualIncome,
        String occupation,
        Boolean student,
        Boolean farmer,
        String category,
        String availableDocuments,
        String panNumber
) {
}
