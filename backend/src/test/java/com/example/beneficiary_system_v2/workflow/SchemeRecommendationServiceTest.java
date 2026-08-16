package com.example.beneficiary_system_v2.workflow;

import com.example.beneficiary_system_v2.scheme.GovernmentScheme;
import com.example.beneficiary_system_v2.scheme.GovernmentSchemeRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SchemeRecommendationServiceTest {

    @Test
    void recommendsImportedActiveSchemeWhenCategoryContainsIntentCategory() {
        GovernmentSchemeRepository governmentSchemeRepository = mock(GovernmentSchemeRepository.class);
        WorkflowSchemeRepository workflowSchemeRepository = mock(WorkflowSchemeRepository.class);
        BeneficiaryWorkflowRepository beneficiaryWorkflowRepository = mock(BeneficiaryWorkflowRepository.class);

        GovernmentScheme scheme = GovernmentScheme.builder()
                .id(1L)
                .schemeName("Education Assistance Scheme")
                .category("Education & Learning")
                .keywords("Student, Scholarship, Education")
                .active(true)
                .source("IMPORTED")
                .verified(false)
                .build();

        when(governmentSchemeRepository.findByActiveTrue()).thenReturn(List.of(scheme));

        SchemeRecommendationService service = new SchemeRecommendationService(
                governmentSchemeRepository,
                workflowSchemeRepository,
                beneficiaryWorkflowRepository
        );

        BeneficiaryWorkflow workflow = BeneficiaryWorkflow.builder().id(99L).build();
        WorkflowIntent intent = new WorkflowIntent(
                "Education",
                "STUDENT",
                "FINANCIAL_ASSISTANCE",
                List.of("student", "scholarship", "education")
        );

        service.recommendSchemes(workflow, intent);

        ArgumentCaptor<WorkflowScheme> captor = ArgumentCaptor.forClass(WorkflowScheme.class);
        verify(workflowSchemeRepository).save(captor.capture());
        assertThat(captor.getValue().getSchemeId()).isEqualTo(1L);
        assertThat(captor.getValue().isRecommended()).isTrue();
    }
}
