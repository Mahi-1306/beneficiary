package com.example.beneficiary_system_v2.workflow;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DeterministicIntentService {

    public WorkflowIntent deriveIntent(String need) {
        String normalizedNeed = need.toLowerCase(Locale.ROOT);
        List<String> keywords = new ArrayList<>();

        String category = "GENERAL";
        if (containsAny(normalizedNeed, "student", "education", "school", "college", "scholarship")) {
            category = "Education";
            addKeywords(keywords, "student", "education", "scholarship");
        } else if (containsAny(normalizedNeed, "health", "hospital", "medical", "treatment")) {
            category = "Healthcare";
            addKeywords(keywords, "healthcare", "hospital", "health");
        } else if (containsAny(normalizedNeed, "gas", "lpg", "cylinder", "cooking")) {
            category = "Social Welfare";
            addKeywords(keywords, "lpg", "gas", "household");
        }

        String beneficiaryType = containsAny(normalizedNeed, "student", "school", "college")
                ? "STUDENT" : "GENERAL";
        String benefitType = containsAny(normalizedNeed, "financial", "assistance", "fund", "money", "scholarship")
                ? "FINANCIAL_ASSISTANCE" : "GENERAL_SUPPORT";

        return new WorkflowIntent(category, beneficiaryType, benefitType, keywords);
    }

    private boolean containsAny(String text, String... values) {
        for (String value : values) {
            if (text.contains(value)) {
                return true;
            }
        }
        return false;
    }

    private void addKeywords(List<String> keywords, String... values) {
        for (String value : values) {
            if (!keywords.contains(value)) {
                keywords.add(value);
            }
        }
    }
}
