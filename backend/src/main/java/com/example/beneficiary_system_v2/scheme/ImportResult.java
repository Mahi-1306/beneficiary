package com.example.beneficiary_system_v2.scheme;

import java.util.List;

public record ImportResult(
        int imported,
        int updated,
        int skipped,
        List<ImportError> errors
) {
    public record ImportError(int row, String reason) {}
}
