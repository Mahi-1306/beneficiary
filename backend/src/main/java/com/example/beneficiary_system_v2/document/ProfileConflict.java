package com.example.beneficiary_system_v2.document;

import java.util.List;

public record ProfileConflict(String field, List<ConflictValue> values) {
}
