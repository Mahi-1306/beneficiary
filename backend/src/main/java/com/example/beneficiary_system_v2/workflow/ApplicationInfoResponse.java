package com.example.beneficiary_system_v2.workflow;

import java.util.List;

public record ApplicationInfoResponse(
        Long workflowId,
        String schemeName,
        String benefits,
        String eligibilitySummary,
        String howToApply,
        List<String> requiredDocuments,
        String officialLink,
        String applicationLink
) {
}
