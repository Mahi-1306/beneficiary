package com.example.beneficiary_system_v2.ai;

import com.example.beneficiary_system_v2.document.DocumentClassification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BeneficiaryExtractionService {

    private static final Pattern AADHAAR_NUMBER = Pattern.compile("(?<!\\d)((?:\\d{4}[\\s-]?){2}\\d{4})(?!\\d)");
    private static final Pattern PAN_NUMBER = Pattern.compile("\\b([A-Z]{5}\\d{4}[A-Z])\\b");
    private static final Pattern DATE_OF_BIRTH = Pattern.compile("(?i)\\b(?:DOB|DATE OF BIRTH)\\s*[:.-]?\\s*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})");
    private static final Pattern NAME = labeledValue("(?:FULL\\s*)?NAME|BENEFICIARY");
    private static final Pattern GENDER = labeledValue("GENDER|SEX");
    private static final Pattern ADDRESS = labeledValue("ADDRESS");
    private static final Pattern STATE = labeledValue("STATE");
    private static final Pattern INCOME = labeledValue("(?:ANNUAL\\s*)?INCOME");
    private static final Pattern OCCUPATION = labeledValue("OCCUPATION");
    private static final Pattern CATEGORY = labeledValue("CATEGORY|CASTE");

    public BeneficiaryData extract(String ocrText, DocumentClassification classification) {
        String text = ocrText == null ? "" : ocrText;
        DocumentClassification documentType = classification == null ? DocumentClassification.UNKNOWN : classification;
        String normalizedUpperText = text.toUpperCase(Locale.ROOT);

        return new BeneficiaryData(
                value(NAME, text),
                normalizedMatch(AADHAAR_NUMBER, text),
                value(DATE_OF_BIRTH, text),
                value(GENDER, text),
                value(ADDRESS, text),
                value(STATE, text),
                incomeValue(text),
                value(OCCUPATION, text),
                booleanValue(documentType == DocumentClassification.STUDENT_CERTIFICATE, normalizedUpperText, "STUDENT"),
                booleanValue(false, normalizedUpperText, "FARMER"),
                value(CATEGORY, text),
                documentType == DocumentClassification.UNKNOWN ? null : documentType.name(),
                normalizedMatch(PAN_NUMBER, normalizedUpperText)
        );
    }

    private static Pattern labeledValue(String label) {
        return Pattern.compile("(?im)^\\s*(?:" + label + ")\\s*:\\s*(.+?)\\s*$");
    }

    private static String value(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private static String normalizedMatch(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group(1).replaceAll("[\\s-]", "") : null;
    }

    private static BigDecimal incomeValue(String text) {
        String income = value(INCOME, text);
        if (income == null) {
            return null;
        }
        String digits = income.replaceAll("\\D", "");
        return digits.isEmpty() ? null : new BigDecimal(digits);
    }

    private static Boolean booleanValue(boolean impliedByClassification, String upperText, String keyword) {
        if (impliedByClassification || upperText.matches("(?s).*\\b" + keyword + "\\b.*")) {
            return true;
        }
        return null;
    }
}
