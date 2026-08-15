package com.example.beneficiary_system_v2.workflow;

import java.util.List;

public record WorkflowIntent(
        String category,
        String beneficiaryType,
        String benefitType,
        List<String> keywords
) {
}
