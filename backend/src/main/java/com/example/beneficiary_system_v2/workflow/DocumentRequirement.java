package com.example.beneficiary_system_v2.workflow;

public record DocumentRequirement(
        String documentType,
        boolean mandatory
) {
}
