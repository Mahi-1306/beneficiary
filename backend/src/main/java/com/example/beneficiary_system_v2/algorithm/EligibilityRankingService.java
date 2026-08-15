package com.example.beneficiary_system_v2.algorithm;

import com.example.beneficiary_system_v2.ai.BeneficiaryData;
import com.example.beneficiary_system_v2.document.BeneficiaryProfileFusionService;
import com.example.beneficiary_system_v2.document.BeneficiaryProfileResponse;
import com.example.beneficiary_system_v2.explainability.ExplainabilityService;
import com.example.beneficiary_system_v2.scheme.GovernmentScheme;
import com.example.beneficiary_system_v2.scheme.GovernmentSchemeRepository;
import com.example.beneficiary_system_v2.workflow.WorkflowScheme;
import com.example.beneficiary_system_v2.workflow.WorkflowSchemeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EligibilityRankingService {

    private static final Pattern INLINE_RULE = Pattern.compile("(?i)(state|gender|minAge|maxAge|maxIncome|occupation|documents)\\s*=\\s*([^;\\n]+)");
    private static final List<DateTimeFormatter> DOB_FORMATS = List.of(
            DateTimeFormatter.ofPattern("d/M/uuuu"),
            DateTimeFormatter.ofPattern("d-M-uuuu")
    );

    private final BeneficiaryProfileFusionService beneficiaryProfileFusionService;
    private final WorkflowSchemeRepository workflowSchemeRepository;
    private final GovernmentSchemeRepository governmentSchemeRepository;
    private final ExplainabilityService explainabilityService;

    public EligibilityRankingService(
            BeneficiaryProfileFusionService beneficiaryProfileFusionService,
            WorkflowSchemeRepository workflowSchemeRepository,
            GovernmentSchemeRepository governmentSchemeRepository,
            ExplainabilityService explainabilityService
    ) {
        this.beneficiaryProfileFusionService = beneficiaryProfileFusionService;
        this.workflowSchemeRepository = workflowSchemeRepository;
        this.governmentSchemeRepository = governmentSchemeRepository;
        this.explainabilityService = explainabilityService;
    }

    public EligibilityEvaluationResponse evaluate(Long workflowId) {
        BeneficiaryProfileResponse profile = beneficiaryProfileFusionService.fuse(workflowId);

        // Policy gate: no criterion is read or evaluated when source documents conflict.
        if (profile.conflictDetected()) {
            return new EligibilityEvaluationResponse(
                    workflowId,
                    EligibilityStatus.MANUAL_REVIEW,
                    "Conflicting beneficiary data requires manual review.",
                    null,
                    List.of(),
                    true,
                    false,
                    profile.conflicts(),
                    explainabilityService.explain(EligibilityStatus.MANUAL_REVIEW, null, List.of(), profile.conflicts())
            );
        }

        GovernmentScheme scheme = selectedScheme(workflowId);
        SchemeCriteria criteria = parseCriteria(scheme);
        BeneficiaryData data = profile.beneficiaryData();
        List<String> missingFields = missingFields(data, criteria);
        if (!missingFields.isEmpty()) {
            return new EligibilityEvaluationResponse(
                    workflowId,
                    EligibilityStatus.INSUFFICIENT_INFORMATION,
                    "Required beneficiary information is missing.",
                    null,
                    missingFields,
                    false,
                    true,
                    List.of(),
                    explainabilityService.explain(EligibilityStatus.INSUFFICIENT_INFORMATION, null, missingFields, List.of())
            );
        }

        SchemeResults results = new SchemeResults(
                matchesState(data.state(), criteria.state()),
                matchesText(data.gender(), criteria.gender()),
                matchesAge(data.dateOfBirth(), criteria.minAge(), criteria.maxAge()),
                matchesIncome(data.annualIncome(), criteria.maxIncome()),
                matchesText(data.occupation(), criteria.occupation()),
                matchesDocuments(data.availableDocuments(), criteria.requiredDocuments())
        );
        boolean eligible = results.stateMatched() && results.genderMatched() && results.ageMatched()
                && results.incomeMatched() && results.occupationMatched() && results.documentMatched();
        EligibilityStatus finalStatus = eligible ? EligibilityStatus.ELIGIBLE : EligibilityStatus.INELIGIBLE;
        return new EligibilityEvaluationResponse(
                workflowId,
                finalStatus,
                eligible ? "All applicable scheme criteria are satisfied." : "One or more scheme criteria are not satisfied.",
                results,
                List.of(),
                false,
                false,
                List.of(),
                explainabilityService.explain(finalStatus, results, List.of(), List.of())
        );
    }

    private GovernmentScheme selectedScheme(Long workflowId) {
        WorkflowScheme workflowScheme = workflowSchemeRepository.findByWorkflowId(workflowId).stream()
                .filter(WorkflowScheme::isSelected)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No scheme has been selected for workflow " + workflowId + "."
                ));
        return governmentSchemeRepository.findById(workflowScheme.getSchemeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Selected scheme " + workflowScheme.getSchemeId() + " does not exist."
                ));
    }

    private SchemeCriteria parseCriteria(GovernmentScheme scheme) {
        String eligibility = scheme.getEligibility() == null ? "" : scheme.getEligibility();
        String normalized = eligibility.toLowerCase(Locale.ROOT);
        Map<String, String> inlineRules = inlineRules(eligibility);
        String state = inlineRules.get("state");
        if (state == null && scheme.getState() != null && !scheme.getState().equalsIgnoreCase("All India")) {
            state = scheme.getState();
        }
        String gender = inlineRules.get("gender");
        if (gender == null && normalized.contains("women")) {
            gender = "female";
        }
        List<String> documents = inlineRules.containsKey("documents")
                ? splitValues(inlineRules.get("documents"))
                : splitValues(scheme.getDocumentsRequired());
        boolean incomeRequired = inlineRules.containsKey("maxincome") || normalized.contains("income");
        boolean studentRequired = normalized.contains("student");
        return new SchemeCriteria(
                state,
                gender,
                integer(inlineRules.get("minage")),
                integer(inlineRules.get("maxage")),
                decimal(inlineRules.get("maxincome")),
                inlineRules.get("occupation"),
                documents,
                incomeRequired,
                studentRequired
        );
    }

    private static List<String> missingFields(BeneficiaryData data, SchemeCriteria criteria) {
        List<String> missing = new ArrayList<>();
        required(missing, "state", criteria.state() != null, data::state);
        required(missing, "gender", criteria.gender() != null, data::gender);
        required(missing, "dateOfBirth", criteria.minAge() != null || criteria.maxAge() != null, data::dateOfBirth);
        required(missing, "annualIncome", criteria.incomeRequired(), data::annualIncome);
        required(missing, "occupation", criteria.occupation() != null, data::occupation);
        required(missing, "student", criteria.studentRequired(), data::student);
        required(missing, "availableDocuments", !criteria.requiredDocuments().isEmpty(), data::availableDocuments);
        return missing;
    }

    private static void required(List<String> missing, String field, boolean required, Supplier<?> value) {
        if (required && value.get() == null) {
            missing.add(field);
        }
    }

    private static boolean matchesState(String actual, String expected) {
        return expected == null || actual.equalsIgnoreCase(expected);
    }

    private static boolean matchesText(String actual, String expected) {
        return expected == null || actual.equalsIgnoreCase(expected);
    }

    private static boolean matchesAge(String dateOfBirth, Integer minAge, Integer maxAge) {
        if (minAge == null && maxAge == null) {
            return true;
        }
        LocalDate dob = parseDateOfBirth(dateOfBirth);
        if (dob == null) {
            return false;
        }
        int age = Period.between(dob, LocalDate.now()).getYears();
        return (minAge == null || age >= minAge) && (maxAge == null || age <= maxAge);
    }

    private static boolean matchesIncome(BigDecimal income, BigDecimal maximum) {
        return maximum == null || income.compareTo(maximum) <= 0;
    }

    private static boolean matchesDocuments(String availableDocuments, List<String> requiredDocuments) {
        if (requiredDocuments.isEmpty()) {
            return true;
        }
        List<String> available = splitValues(availableDocuments);
        return requiredDocuments.stream().allMatch(required -> available.stream().anyMatch(required::equalsIgnoreCase));
    }

    private static Map<String, String> inlineRules(String eligibility) {
        Matcher matcher = INLINE_RULE.matcher(eligibility);
        java.util.HashMap<String, String> rules = new java.util.HashMap<>();
        while (matcher.find()) {
            rules.put(matcher.group(1).toLowerCase(Locale.ROOT), matcher.group(2).trim());
        }
        return rules;
    }

    private static List<String> splitValues(String values) {
        if (values == null || values.isBlank()) {
            return List.of();
        }
        return Arrays.stream(values.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }

    private static Integer integer(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Integer.valueOf(value.trim());
    }

    private static BigDecimal decimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String digits = value.replaceAll("[^0-9.]", "");
        return digits.isEmpty() ? null : new BigDecimal(digits);
    }

    private static LocalDate parseDateOfBirth(String value) {
        for (DateTimeFormatter format : DOB_FORMATS) {
            try {
                return LocalDate.parse(value, format);
            } catch (DateTimeParseException ignored) {
                // Try the next supported deterministic date format.
            }
        }
        return null;
    }

    private record SchemeCriteria(
            String state,
            String gender,
            Integer minAge,
            Integer maxAge,
            BigDecimal maxIncome,
            String occupation,
            List<String> requiredDocuments,
            boolean incomeRequired,
            boolean studentRequired
    ) {
    }
}
