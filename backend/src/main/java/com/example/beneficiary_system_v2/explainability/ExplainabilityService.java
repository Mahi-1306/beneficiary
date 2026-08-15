package com.example.beneficiary_system_v2.explainability;

import com.example.beneficiary_system_v2.algorithm.EligibilityStatus;
import com.example.beneficiary_system_v2.algorithm.SchemeResults;
import com.example.beneficiary_system_v2.document.ProfileConflict;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ExplainabilityService {

    /**
     * Builds a checklist explanation from the deterministic eligibility result.
     * The ✓/✗ symbols and pass/fail facts come exclusively from SchemeResults
     * booleans — nothing is inferred or invented here.
     */
    public List<String> explain(EligibilityStatus status, SchemeResults results,
                                List<String> missingFields, List<ProfileConflict> conflicts) {
        List<String> lines = new ArrayList<>();

        if (status == EligibilityStatus.MANUAL_REVIEW) {
            lines.add("⚠ Manual review required: conflicting data detected across uploaded documents.");
            for (ProfileConflict c : conflicts) {
                lines.add("  Conflict on field \"" + c.field() + "\"");
            }
            return lines;
        }

        if (status == EligibilityStatus.INSUFFICIENT_INFORMATION) {
            lines.add("⚠ Evaluation incomplete: required information is missing.");
            for (String field : missingFields) {
                lines.add("  ✗ Missing field: " + field);
            }
            return lines;
        }

        // ELIGIBLE or INELIGIBLE — results is non-null at this point.
        lines.add(results.stateMatched()      ? "✓ State requirement satisfied"              : "✗ State requirement not satisfied");
        lines.add(results.genderMatched()     ? "✓ Gender requirement satisfied"             : "✗ Gender requirement not satisfied");
        lines.add(results.ageMatched()        ? "✓ Age requirement satisfied"                : "✗ Age requirement not satisfied");
        lines.add(results.incomeMatched()     ? "✓ Income requirement satisfied"             : "✗ Income requirement not satisfied");
        lines.add(results.occupationMatched() ? "✓ Occupation requirement satisfied"         : "✗ Occupation requirement not satisfied");
        lines.add(results.documentMatched()   ? "✓ Required documents verified"              : "✗ One or more required documents are missing");

        return lines;
    }
}
