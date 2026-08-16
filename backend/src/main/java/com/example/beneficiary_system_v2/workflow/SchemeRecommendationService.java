package com.example.beneficiary_system_v2.workflow;

import com.example.beneficiary_system_v2.scheme.GovernmentScheme;
import com.example.beneficiary_system_v2.scheme.GovernmentSchemeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class SchemeRecommendationService {

    private final GovernmentSchemeRepository governmentSchemeRepository;
    private final WorkflowSchemeRepository workflowSchemeRepository;
    private final BeneficiaryWorkflowRepository beneficiaryWorkflowRepository;

    public SchemeRecommendationService(
            GovernmentSchemeRepository governmentSchemeRepository,
            WorkflowSchemeRepository workflowSchemeRepository,
            BeneficiaryWorkflowRepository beneficiaryWorkflowRepository
    ) {
        this.governmentSchemeRepository = governmentSchemeRepository;
        this.workflowSchemeRepository = workflowSchemeRepository;
        this.beneficiaryWorkflowRepository = beneficiaryWorkflowRepository;
    }

    @Transactional
    public void recommendSchemes(BeneficiaryWorkflow workflow, WorkflowIntent intent) {
        governmentSchemeRepository.findByActiveTrue().stream()
                .filter(this::isRecommendable)
                .filter(scheme -> matches(scheme, intent))
                .forEach(scheme -> workflowSchemeRepository.save(WorkflowScheme.builder()
                        .workflowId(workflow.getId())
                        .schemeId(scheme.getId())
                        .recommended(true)
                        .selected(false)
                        .build()));

        workflow.setStatus(WorkflowStatus.SCHEMES_RECOMMENDED);
        workflow.setUpdatedAt(LocalDateTime.now());
        beneficiaryWorkflowRepository.save(workflow);
    }

    private boolean isRecommendable(GovernmentScheme scheme) {
        if (scheme == null || Boolean.FALSE.equals(scheme.getActive())) {
            return false;
        }
        if (Boolean.TRUE.equals(scheme.getVerified())) {
            return true;
        }
        return "IMPORTED".equalsIgnoreCase(scheme.getSource());
    }

    private boolean matches(GovernmentScheme scheme, WorkflowIntent intent) {
        if (scheme == null) {
            return false;
        }

        String category = scheme.getCategory();
        String intentCategory = intent.category();
        if (category != null && intentCategory != null) {
            String normalizedCategory = normalizeCategory(category);
            String normalizedIntentCategory = normalizeCategory(intentCategory);
            if (!normalizedCategory.isBlank() && !normalizedIntentCategory.isBlank()) {
                if (normalizedCategory.contains(normalizedIntentCategory)
                        || normalizedIntentCategory.contains(normalizedCategory)) {
                    return true;
                }
            }
        }

        String schemeKeywords = scheme.getKeywords() == null ? "" : scheme.getKeywords().toLowerCase(Locale.ROOT);
        if (schemeKeywords.isBlank()) {
            return false;
        }

        String normalizedIntent = intent.keywords() == null ? "" : String.join(" ", intent.keywords()).toLowerCase(Locale.ROOT);
        if (normalizedIntent.isBlank()) {
            return false;
        }

        return intent.keywords().stream()
                .map(keyword -> keyword.toLowerCase(Locale.ROOT))
                .anyMatch(keyword -> schemeKeywords.contains(keyword) || schemeKeywords.contains(keyword.replace("-", " ")));
    }

    private String normalizeCategory(String category) {
        if (category == null) {
            return "";
        }
        return category.toLowerCase(Locale.ROOT)
                .replace("&", " ")
                .replace("/", " ")
                .replace("-", " ")
                .replace(",", " ")
                .replace("_", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
