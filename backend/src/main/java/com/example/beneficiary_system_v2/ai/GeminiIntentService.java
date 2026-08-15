package com.example.beneficiary_system_v2.ai;

import com.example.beneficiary_system_v2.workflow.WorkflowIntent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class GeminiIntentService {

    private static final Logger log = LoggerFactory.getLogger(GeminiIntentService.class);
    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=";

    private static final String PROMPT_TEMPLATE = """
            You are a government scheme classification assistant.
            Given a beneficiary's stated need, extract the intent as JSON with exactly these fields:
            - category: one of "Education", "Healthcare", "Social Welfare", "Agriculture", "GENERAL"
            - beneficiaryType: one of "STUDENT", "FARMER", "WOMAN", "SENIOR_CITIZEN", "GENERAL"
            - benefitType: one of "FINANCIAL_ASSISTANCE", "HEALTHCARE_SUPPORT", "SUBSIDY", "GENERAL_SUPPORT"
            - keywords: a JSON array of 2–5 lowercase relevant keywords

            Respond with ONLY the raw JSON object, no markdown, no explanation.

            Need: "%s"
            """;

    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiIntentService(@Value("${app.gemini.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    /**
     * Calls Gemini to derive a WorkflowIntent from free-text need.
     * Returns null on any failure (missing key, network error, bad JSON, timeout)
     * so the caller can fall back to the deterministic service.
     */
    public WorkflowIntent deriveIntent(String need) {
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("Gemini API key not configured — skipping LLM intent derivation.");
            return null;
        }
        try {
            String prompt = PROMPT_TEMPLATE.formatted(need.replace("\"", "\\\""));
            String requestBody = """
                    {"contents":[{"parts":[{"text":%s}]}]}
                    """.formatted(objectMapper.writeValueAsString(prompt));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ENDPOINT + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("Gemini returned HTTP {} — falling back to deterministic intent.", response.statusCode());
                return null;
            }

            return parseIntent(response.body());

        } catch (Exception e) {
            log.warn("Gemini intent call failed ({}) — falling back to deterministic intent.", e.getMessage());
            return null;
        }
    }

    private WorkflowIntent parseIntent(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        // Extract the text content from candidates[0].content.parts[0].text
        JsonNode textNode = root.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode()) {
            log.warn("Gemini response missing expected text node — falling back.");
            return null;
        }

        String text = textNode.asText().trim();
        // Strip markdown code fences if Gemini wraps the JSON anyway
        if (text.startsWith("```")) {
            text = text.replaceAll("(?s)^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
        }

        JsonNode intent = objectMapper.readTree(text);
        String category      = stringOrDefault(intent, "category",      "GENERAL");
        String beneficiaryType = stringOrDefault(intent, "beneficiaryType", "GENERAL");
        String benefitType   = stringOrDefault(intent, "benefitType",   "GENERAL_SUPPORT");

        List<String> keywords = new ArrayList<>();
        JsonNode kw = intent.path("keywords");
        if (kw.isArray()) {
            kw.forEach(k -> keywords.add(k.asText().toLowerCase()));
        }

        return new WorkflowIntent(category, beneficiaryType, benefitType, keywords);
    }

    private static String stringOrDefault(JsonNode node, String field, String defaultValue) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? defaultValue : value.asText();
    }
}
