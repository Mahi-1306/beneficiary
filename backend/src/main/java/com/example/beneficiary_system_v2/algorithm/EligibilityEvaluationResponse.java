package com.example.beneficiary_system_v2.algorithm;

import com.example.beneficiary_system_v2.document.ProfileConflict;

import java.util.List;

public record EligibilityEvaluationResponse(
        Long workflowId,
        EligibilityStatus status,
        String message,
        SchemeResults schemeResults,
        List<String> missingFields,
        boolean conflictDetected,
        boolean insufficientInformation,
        List<ProfileConflict> conflicts,
        List<String> explanation
) {
}
