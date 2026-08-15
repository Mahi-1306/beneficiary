package com.example.beneficiary_system_v2.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkflowSchemeRepository extends JpaRepository<WorkflowScheme, Long> {

    List<WorkflowScheme> findByWorkflowIdAndRecommendedTrue(Long workflowId);

    List<WorkflowScheme> findByWorkflowId(Long workflowId);

    Optional<WorkflowScheme> findByWorkflowIdAndSchemeIdAndRecommendedTrue(Long workflowId, Long schemeId);
}
