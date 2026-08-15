package com.example.beneficiary_system_v2.algorithm;

public record SchemeResults(
        boolean stateMatched,
        boolean genderMatched,
        boolean ageMatched,
        boolean incomeMatched,
        boolean occupationMatched,
        boolean documentMatched
) {
}
