package com.example.beneficiary_system_v2.workflow;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class SchemeSelectionService {

    private final BeneficiaryWorkflowRepository beneficiaryWorkflowRepository;
    private final WorkflowSchemeRepository workflowSchemeRepository;

    public SchemeSelectionService(
            BeneficiaryWorkflowRepository beneficiaryWorkflowRepository,
            WorkflowSchemeRepository workflowSchemeRepository
    ) {
        this.beneficiaryWorkflowRepository = beneficiaryWorkflowRepository;
        this.workflowSchemeRepository = workflowSchemeRepository;
    }

    @Transactional
    public SchemeSelectionResponse selectRecommendedScheme(Long workflowId, Long schemeId) {
        BeneficiaryWorkflow workflow = beneficiaryWorkflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Workflow " + workflowId + " does not exist."
                ));

        WorkflowScheme selectedWorkflowScheme = workflowSchemeRepository
                .findByWorkflowIdAndSchemeIdAndRecommendedTrue(workflowId, schemeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Scheme " + schemeId + " is not recommended for workflow " + workflowId + "."
                ));

        workflowSchemeRepository.findByWorkflowId(workflowId).forEach(workflowScheme -> {
            if (workflowScheme.isSelected()) {
                workflowScheme.setSelected(false);
            }
        });
        selectedWorkflowScheme.setSelected(true);

        workflow.setStatus(WorkflowStatus.SCHEME_SELECTED);
        workflow.setUpdatedAt(LocalDateTime.now());

        return new SchemeSelectionResponse(
                workflowId,
                schemeId,
                true,
                workflow.getStatus()
        );
    }
}
