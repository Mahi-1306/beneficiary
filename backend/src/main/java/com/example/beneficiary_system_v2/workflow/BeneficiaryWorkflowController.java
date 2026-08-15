package com.example.beneficiary_system_v2.workflow;

import com.example.beneficiary_system_v2.algorithm.EligibilityEvaluationResponse;
import com.example.beneficiary_system_v2.algorithm.EligibilityRankingService;
import com.example.beneficiary_system_v2.ai.GeminiIntentService;
import com.example.beneficiary_system_v2.document.BeneficiaryProfileFusionService;
import com.example.beneficiary_system_v2.document.BeneficiaryProfileResponse;
import com.example.beneficiary_system_v2.scheme.GovernmentScheme;
import com.example.beneficiary_system_v2.scheme.GovernmentSchemeRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/workflows")
public class BeneficiaryWorkflowController {

    private final BeneficiaryWorkflowRepository beneficiaryWorkflowRepository;
    private final WorkflowSchemeRepository workflowSchemeRepository;
    private final GovernmentSchemeRepository governmentSchemeRepository;
    private final DeterministicIntentService deterministicIntentService;
    private final GeminiIntentService geminiIntentService;
    private final SchemeRecommendationService schemeRecommendationService;
    private final SchemeSelectionService schemeSelectionService;
    private final BeneficiaryProfileFusionService beneficiaryProfileFusionService;
    private final EligibilityRankingService eligibilityRankingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BeneficiaryWorkflowController(
            BeneficiaryWorkflowRepository beneficiaryWorkflowRepository,
            WorkflowSchemeRepository workflowSchemeRepository,
            GovernmentSchemeRepository governmentSchemeRepository,
            DeterministicIntentService deterministicIntentService,
            GeminiIntentService geminiIntentService,
            SchemeRecommendationService schemeRecommendationService,
            SchemeSelectionService schemeSelectionService,
            BeneficiaryProfileFusionService beneficiaryProfileFusionService,
            EligibilityRankingService eligibilityRankingService
    ) {
        this.beneficiaryWorkflowRepository = beneficiaryWorkflowRepository;
        this.workflowSchemeRepository = workflowSchemeRepository;
        this.governmentSchemeRepository = governmentSchemeRepository;
        this.deterministicIntentService = deterministicIntentService;
        this.geminiIntentService = geminiIntentService;
        this.schemeRecommendationService = schemeRecommendationService;
        this.schemeSelectionService = schemeSelectionService;
        this.beneficiaryProfileFusionService = beneficiaryProfileFusionService;
        this.eligibilityRankingService = eligibilityRankingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BeneficiaryWorkflow createWorkflow(@RequestBody CreateWorkflowRequest request) {
        if (request == null || request.need() == null || request.need().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Field 'need' is required.");
        }

        WorkflowIntent intent = geminiIntentService.deriveIntent(request.need());
        if (intent == null) {
            intent = deterministicIntentService.deriveIntent(request.need());
        }
        LocalDateTime now = LocalDateTime.now();
        BeneficiaryWorkflow workflow = BeneficiaryWorkflow.builder()
                .rawNeed(request.need())
                .intentJson(writeIntent(intent))
                .status(WorkflowStatus.CREATED)
                .createdAt(now)
                .updatedAt(now)
                .build();
        workflow = beneficiaryWorkflowRepository.save(workflow);
        schemeRecommendationService.recommendSchemes(workflow, intent);
        return beneficiaryWorkflowRepository.findById(workflow.getId()).orElseThrow();
    }

    @GetMapping("/{id}")
    public WorkflowDetailsResponse getWorkflow(@PathVariable Long id) {
        BeneficiaryWorkflow workflow = beneficiaryWorkflowRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workflow " + id + " was not found."));
        List<Long> recommendedSchemeIds = workflowSchemeRepository.findByWorkflowIdAndRecommendedTrue(id).stream()
                .map(WorkflowScheme::getSchemeId)
                .toList();
        List<GovernmentScheme> recommendedSchemes = governmentSchemeRepository.findAllById(recommendedSchemeIds);
        return new WorkflowDetailsResponse(workflow, recommendedSchemes);
    }

    @GetMapping("/{workflowId}/profile")
    public BeneficiaryProfileResponse getProfile(@PathVariable Long workflowId) {
        if (!beneficiaryWorkflowRepository.existsById(workflowId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workflow " + workflowId + " was not found.");
        }
        return beneficiaryProfileFusionService.fuse(workflowId);
    }

    @PostMapping("/{workflowId}/eligibility/evaluate")
    public EligibilityEvaluationResponse evaluateEligibility(@PathVariable Long workflowId) {
        if (!beneficiaryWorkflowRepository.existsById(workflowId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workflow " + workflowId + " was not found.");
        }
        return eligibilityRankingService.evaluate(workflowId);
    }

    @PostMapping("/{workflowId}/schemes/{schemeId}/select")
    public SchemeSelectionResponse selectScheme(@PathVariable Long workflowId, @PathVariable Long schemeId) {
        return schemeSelectionService.selectRecommendedScheme(workflowId, schemeId);
    }

    @GetMapping("/{workflowId}/application")
    public ApplicationInfoResponse getApplicationInfo(@PathVariable Long workflowId) {
        if (!beneficiaryWorkflowRepository.existsById(workflowId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Workflow " + workflowId + " was not found.");
        }
        WorkflowScheme selectedWorkflowScheme = workflowSchemeRepository.findByWorkflowId(workflowId).stream()
                .filter(WorkflowScheme::isSelected)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No scheme has been selected for workflow " + workflowId + "."
                ));
        GovernmentScheme scheme = governmentSchemeRepository.findById(selectedWorkflowScheme.getSchemeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Selected scheme does not exist."
                ));
        List<String> docs = (scheme.getDocumentsRequired() == null || scheme.getDocumentsRequired().isBlank())
                ? List.of()
                : Arrays.stream(scheme.getDocumentsRequired().split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).toList();
        return new ApplicationInfoResponse(
                workflowId,
                scheme.getSchemeName(),
                scheme.getBenefits(),
                scheme.getEligibility(),
                "Visit the official portal at " + scheme.getApplicationLink()
                        + " to submit your application online, or contact the " + scheme.getDepartment()
                        + " office for offline assistance.",
                docs,
                scheme.getOfficialLink(),
                scheme.getApplicationLink()
        );
    }

    @GetMapping("/{workflowId}/requirements")
    public List<DocumentRequirement> getRequirements(@PathVariable Long workflowId) {
        if (!beneficiaryWorkflowRepository.existsById(workflowId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workflow " + workflowId + " does not exist.");
        }

        WorkflowScheme selectedWorkflowScheme = workflowSchemeRepository.findByWorkflowId(workflowId).stream()
                .filter(WorkflowScheme::isSelected)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No scheme has been selected for workflow " + workflowId + "."
                ));
        GovernmentScheme selectedScheme = governmentSchemeRepository.findById(selectedWorkflowScheme.getSchemeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selected scheme " + selectedWorkflowScheme.getSchemeId() + " does not exist."
                ));
        if (selectedScheme.getDocumentsRequired() == null || selectedScheme.getDocumentsRequired().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected scheme " + selectedScheme.getId() + " has no document requirements configured."
            );
        }

        return Arrays.stream(selectedScheme.getDocumentsRequired().split(","))
                .map(String::trim)
                .filter(documentType -> !documentType.isEmpty())
                .map(documentType -> new DocumentRequirement(documentType, true))
                .toList();
    }

    private String writeIntent(WorkflowIntent intent) {
        try {
            return objectMapper.writeValueAsString(intent);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize the derived workflow intent.", exception);
        }
    }
}
