package com.example.beneficiary_system_v2.document;

import com.example.beneficiary_system_v2.ai.BeneficiaryData;

import java.util.List;

public record BeneficiaryProfileResponse(
        BeneficiaryData beneficiaryData,
        boolean conflictDetected,
        List<ProfileConflict> conflicts
) {
}
