package com.example.beneficiary_system_v2.document;

import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class DocumentClassificationService {

    private static final Pattern AADHAAR_NUMBER = Pattern.compile("(?<!\\d)(?:\\d{4}[\\s-]?){2}\\d{4}(?!\\d)");
    private static final Pattern PAN_NUMBER = Pattern.compile("\\b[A-Z]{5}\\d{4}[A-Z]\\b");

    public DocumentClassification classify(String ocrText) {
        if (ocrText == null || ocrText.isBlank()) {
            return DocumentClassification.UNKNOWN;
        }

        String text = ocrText.toUpperCase(Locale.ROOT);
        if ((text.contains("AADHAAR") || text.contains("AADHAR")) && AADHAAR_NUMBER.matcher(ocrText).find()) {
            return DocumentClassification.AADHAAR;
        }
        if ((text.contains("PERMANENT ACCOUNT NUMBER") || text.contains("INCOME TAX DEPARTMENT"))
                && PAN_NUMBER.matcher(text).find()) {
            return DocumentClassification.PAN;
        }
        if (text.contains("INCOME CERTIFICATE")) {
            return DocumentClassification.INCOME_CERTIFICATE;
        }
        if (text.contains("CASTE CERTIFICATE") || text.contains("COMMUNITY CERTIFICATE")) {
            return DocumentClassification.CASTE_CERTIFICATE;
        }
        if (text.contains("RESIDENCE CERTIFICATE") || text.contains("DOMICILE CERTIFICATE")) {
            return DocumentClassification.RESIDENCE_CERTIFICATE;
        }
        if (text.contains("STUDENT CERTIFICATE") || text.contains("BONAFIDE CERTIFICATE")) {
            return DocumentClassification.STUDENT_CERTIFICATE;
        }
        if (text.contains("DISABILITY CERTIFICATE") || text.contains("PERSON WITH DISABILITY")) {
            return DocumentClassification.DISABILITY_CERTIFICATE;
        }
        return DocumentClassification.UNKNOWN;
    }
}
