package com.example.beneficiary_system_v2.workflow;

public record SchemeSelectionResponse(
        Long workflowId,
        Long schemeId,
        boolean selected,
        WorkflowStatus status
) {
}
