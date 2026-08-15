package com.example.beneficiary_system_v2;

import com.example.beneficiary_system_v2.ai.GeminiIntentService;
import com.example.beneficiary_system_v2.document.OcrService;
import net.sourceforge.tess4j.TesseractException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Phase 10 — end-to-end integration test + error-handling tests.
 *
 * External dependencies mocked:
 *   - GeminiIntentService  → returns null so DeterministicIntentService handles intent
 *   - OcrService           → returns controlled synthetic text per upload call
 *
 * Requires a running MySQL instance (same as application.properties).
 * Run with: mvn test -Dtest=Phase10IntegrationTest
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase10IntegrationTest {

    // ── Synthetic OCR texts that classify correctly ──────────────────────────

    private static final String AADHAAR_TEXT = """
            GOVERNMENT OF INDIA
            Aadhaar
            Name: Rahul Kumar
            Date of Birth: 15/08/1998
            Gender: Male
            Address: 12 MG Road, Bengaluru
            State: Karnataka
            1234 5678 9012
            """;

    private static final String INCOME_TEXT = """
            INCOME CERTIFICATE
            This is to certify that Rahul Kumar residing at 12 MG Road, Bengaluru
            State: Karnataka
            Annual Income: 80000
            Occupation: Student
            """;

    private static final String STUDENT_TEXT = """
            STUDENT CERTIFICATE
            This is to certify that Rahul Kumar is a bonafide student
            of ABC College, Bengaluru.
            """;

    private static final String UNKNOWN_TEXT = "random unrecognised content with no document markers";

    // ── Shared state across ordered tests ────────────────────────────────────

    private static Long workflowId;
    private static Long schemeId;

    @LocalServerPort
    private int port;

    private RestTemplate rest;

    @MockitoBean
    private GeminiIntentService geminiIntentService;

    @MockitoBean
    private OcrService ocrService;

    @BeforeEach
    void setUp() {
        rest = new RestTemplate();
        // Never throw on 4xx/5xx — let tests assert the status themselves
        rest.setErrorHandler(new DefaultResponseErrorHandler() {
            @Override
            public boolean hasError(org.springframework.http.client.ClientHttpResponse response) {
                return false;
            }
        });
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 1 — Full happy-path demo
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void step1_createWorkflow() {
        when(geminiIntentService.deriveIntent(anyString())).thenReturn(null);

        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/workflows"),
                Map.of("need", "I am a student and need financial help for my education"),
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).containsKey("id");
        workflowId = ((Number) response.getBody().get("id")).longValue();
    }

    @Test
    @Order(2)
    void step2_recommendedSchemesIncludeNationalScholarship() {
        ResponseEntity<Map> response = rest.getForEntity(url("/api/workflows/" + workflowId), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> schemes = (List<?>) response.getBody().get("recommendedSchemes");
        assertThat(schemes).isNotEmpty();
        boolean found = schemes.stream()
                .map(s -> (Map<?, ?>) s)
                .anyMatch(s -> "National Scholarship Scheme".equals(s.get("schemeName")));
        assertThat(found).as("National Scholarship Scheme must be recommended").isTrue();
    }

    @Test
    @Order(3)
    void step3_findNationalScholarshipSchemeId() {
        ResponseEntity<List> response = rest.getForEntity(url("/api/schemes"), List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        schemeId = ((List<Map<?, ?>>) (List<?>) response.getBody()).stream()
                .filter(s -> "National Scholarship Scheme".equals(s.get("schemeName")))
                .map(s -> ((Number) s.get("id")).longValue())
                .findFirst()
                .orElseThrow(() -> new AssertionError("National Scholarship Scheme not seeded"));
    }

    @Test
    @Order(4)
    void step4_selectNationalScholarshipScheme() {
        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/workflows/" + workflowId + "/schemes/" + schemeId + "/select"),
                null,
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("selected")).isEqualTo(true);
    }

    @Test
    @Order(5)
    void step5_getRequirements() {
        ResponseEntity<List> response = rest.getForEntity(
                url("/api/workflows/" + workflowId + "/requirements"), List.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<?, ?>> reqs = (List<Map<?, ?>>) (List<?>) response.getBody();
        assertThat(reqs).isNotEmpty();
        List<String> docTypes = reqs.stream().map(r -> (String) r.get("documentType")).toList();
        assertThat(docTypes).contains("AADHAAR", "INCOME_CERTIFICATE", "STUDENT_CERTIFICATE");
    }

    @Test
    @Order(6)
    void step6_uploadAadhaar() throws Exception {
        when(ocrService.extractText(any(Path.class), anyString())).thenReturn(AADHAAR_TEXT);

        ResponseEntity<Map> response = uploadFile(workflowId, "aadhaar.png", "image/png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("CLASSIFIED_AND_EXTRACTED");
    }

    @Test
    @Order(7)
    void step7_uploadIncomeCertificate() throws Exception {
        when(ocrService.extractText(any(Path.class), anyString())).thenReturn(INCOME_TEXT);

        ResponseEntity<Map> response = uploadFile(workflowId, "income.png", "image/png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("CLASSIFIED_AND_EXTRACTED");
    }

    @Test
    @Order(8)
    void step8_uploadStudentCertificate() throws Exception {
        when(ocrService.extractText(any(Path.class), anyString())).thenReturn(STUDENT_TEXT);

        ResponseEntity<Map> response = uploadFile(workflowId, "student.png", "image/png");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("CLASSIFIED_AND_EXTRACTED");
    }

    @Test
    @Order(9)
    void step9_fusedProfileHasNoConflicts() {
        ResponseEntity<Map> response = rest.getForEntity(
                url("/api/workflows/" + workflowId + "/profile"), Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("conflictDetected")).isEqualTo(false);
        Map<?, ?> data = (Map<?, ?>) response.getBody().get("beneficiaryData");
        assertThat(data.get("fullName")).isNotNull();
        assertThat(data.get("annualIncome")).isNotNull();
        assertThat(data.get("student")).isEqualTo(true);
    }

    @Test
    @Order(10)
    void step10_evaluateEligibility() {
        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/workflows/" + workflowId + "/eligibility/evaluate"), null, Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        String status = (String) response.getBody().get("status");
        assertThat(status).isIn("ELIGIBLE", "INELIGIBLE", "INSUFFICIENT_INFORMATION");
        assertThat(response.getBody().get("explanation")).isNotNull();
    }

    @Test
    @Order(11)
    void step11_explanationPresent() {
        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/workflows/" + workflowId + "/eligibility/evaluate"), null, Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> explanation = (List<?>) response.getBody().get("explanation");
        assertThat(explanation).isNotEmpty();
    }

    @Test
    @Order(12)
    void step12_getApplicationInfo() {
        ResponseEntity<Map> response = rest.getForEntity(
                url("/api/workflows/" + workflowId + "/application"), Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("schemeName")).isEqualTo("National Scholarship Scheme");
        assertThat(response.getBody().get("applicationLink")).isNotNull();
        assertThat(response.getBody().get("howToApply")).isNotNull();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 2 — Error-handling tests
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(20)
    void error_workflowNotFound_returns404() {
        ResponseEntity<Map> response = rest.getForEntity(url("/api/workflows/999999"), Map.class);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).containsKey("error");
        assertThat(response.getBody().get("path").toString()).contains("999999");
    }

    @Test
    @Order(21)
    void error_schemeNotFound_selectReturns400() {
        when(geminiIntentService.deriveIntent(anyString())).thenReturn(null);

        ResponseEntity<Map> wf = rest.postForEntity(
                url("/api/workflows"),
                Map.of("need", "student scholarship"),
                Map.class
        );
        Long freshId = ((Number) wf.getBody().get("id")).longValue();

        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/workflows/" + freshId + "/schemes/999999/select"),
                null,
                Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).containsKey("error");
        assertThat(response.getBody().get("path").toString()).contains("999999");
    }

    @Test
    @Order(22)
    void error_uploadWithoutSchemeSelected_returns400() throws Exception {
        when(geminiIntentService.deriveIntent(anyString())).thenReturn(null);

        ResponseEntity<Map> wf = rest.postForEntity(
                url("/api/workflows"),
                Map.of("need", "student scholarship"),
                Map.class
        );
        Long freshId = ((Number) wf.getBody().get("id")).longValue();

        ResponseEntity<Map> response = uploadFile(freshId, "aadhaar.png", "image/png");

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).containsKey("error");
        assertThat(response.getBody().get("error").toString()).containsIgnoringCase("Bad Request");
    }

    @Test
    @Order(23)
    void error_unknownDocumentUpload_returns422() throws Exception {
        when(geminiIntentService.deriveIntent(anyString())).thenReturn(null);
        when(ocrService.extractText(any(Path.class), anyString())).thenReturn(UNKNOWN_TEXT);

        ResponseEntity<Map> wf = rest.postForEntity(
                url("/api/workflows"),
                Map.of("need", "student scholarship"),
                Map.class
        );
        Long freshId = ((Number) wf.getBody().get("id")).longValue();

        Long nssId = findNationalScholarshipId();
        rest.postForEntity(url("/api/workflows/" + freshId + "/schemes/" + nssId + "/select"), null, Map.class);

        ResponseEntity<Map> response = uploadFile(freshId, "random.png", "image/png");

        assertThat(response.getStatusCode().value()).isEqualTo(422);
        assertThat(response.getBody()).containsKey("error");
    }

    @Test
    @Order(24)
    void error_missingRequiredDocument_eligibilityReportsInsufficient() throws Exception {
        when(geminiIntentService.deriveIntent(anyString())).thenReturn(null);

        ResponseEntity<Map> wf = rest.postForEntity(
                url("/api/workflows"),
                Map.of("need", "student scholarship"),
                Map.class
        );
        Long freshId = ((Number) wf.getBody().get("id")).longValue();

        Long nssId = findNationalScholarshipId();
        rest.postForEntity(url("/api/workflows/" + freshId + "/schemes/" + nssId + "/select"), null, Map.class);

        // Upload only Aadhaar — income + student docs missing
        when(ocrService.extractText(any(Path.class), anyString())).thenReturn(AADHAAR_TEXT);
        uploadFile(freshId, "aadhaar.png", "image/png");

        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/workflows/" + freshId + "/eligibility/evaluate"), null, Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("status")).isEqualTo("INSUFFICIENT_INFORMATION");
        assertThat(response.getBody().get("insufficientInformation")).isEqualTo(true);
        assertThat((List<?>) response.getBody().get("missingFields")).isNotEmpty();
    }

    @Test
    @Order(25)
    void error_conflictingDocuments_eligibilityReportsManualReview() throws Exception {
        when(geminiIntentService.deriveIntent(anyString())).thenReturn(null);

        ResponseEntity<Map> wf = rest.postForEntity(
                url("/api/workflows"),
                Map.of("need", "student scholarship"),
                Map.class
        );
        Long freshId = ((Number) wf.getBody().get("id")).longValue();

        Long nssId = findNationalScholarshipId();
        rest.postForEntity(url("/api/workflows/" + freshId + "/schemes/" + nssId + "/select"), null, Map.class);

        // First Aadhaar — Rahul Kumar, Male
        when(ocrService.extractText(any(Path.class), anyString())).thenReturn(AADHAAR_TEXT);
        uploadFile(freshId, "aadhaar1.png", "image/png");

        // Second Aadhaar — conflicting name and gender
        String conflicting = AADHAAR_TEXT.replace("Rahul Kumar", "Priya Sharma").replace("Male", "Female");
        when(ocrService.extractText(any(Path.class), anyString())).thenReturn(conflicting);
        uploadFile(freshId, "aadhaar2.png", "image/png");

        ResponseEntity<Map> response = rest.postForEntity(
                url("/api/workflows/" + freshId + "/eligibility/evaluate"), null, Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("status")).isEqualTo("MANUAL_REVIEW");
        assertThat(response.getBody().get("conflictDetected")).isEqualTo(true);
        assertThat((List<?>) response.getBody().get("conflicts")).isNotEmpty();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private ResponseEntity<Map> uploadFile(Long wfId, String filename, String contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("workflowId", wfId);
        body.add("file", new ByteArrayResource("dummy".getBytes()) {
            @Override
            public String getFilename() {
                return filename;
            }
        });

        return rest.exchange(
                url("/api/documents/upload"),
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
        );
    }

    private Long findNationalScholarshipId() {
        ResponseEntity<List> response = rest.getForEntity(url("/api/schemes"), List.class);
        return ((List<Map<?, ?>>) (List<?>) response.getBody()).stream()
                .filter(s -> "National Scholarship Scheme".equals(s.get("schemeName")))
                .map(s -> ((Number) s.get("id")).longValue())
                .findFirst()
                .orElseThrow(() -> new AssertionError("National Scholarship Scheme not seeded"));
    }
}
