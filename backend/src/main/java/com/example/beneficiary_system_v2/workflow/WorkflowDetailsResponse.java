package com.example.beneficiary_system_v2.workflow;

import com.example.beneficiary_system_v2.scheme.GovernmentScheme;

import java.util.List;

public record WorkflowDetailsResponse(
        BeneficiaryWorkflow workflow,
        List<GovernmentScheme> recommendedSchemes
) {
}
