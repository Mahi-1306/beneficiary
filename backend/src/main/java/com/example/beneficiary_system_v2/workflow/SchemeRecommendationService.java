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
        governmentSchemeRepository.findAll().stream()
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

    private boolean matches(GovernmentScheme scheme, WorkflowIntent intent) {
        if (scheme.getCategory() != null && scheme.getCategory().equalsIgnoreCase(intent.category())) {
            return true;
        }

        String schemeKeywords = scheme.getKeywords() == null ? "" : scheme.getKeywords().toLowerCase(Locale.ROOT);
        return intent.keywords().stream()
                .map(keyword -> keyword.toLowerCase(Locale.ROOT))
                .anyMatch(schemeKeywords::contains);
    }
}
