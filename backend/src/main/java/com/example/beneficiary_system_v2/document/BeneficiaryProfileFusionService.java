package com.example.beneficiary_system_v2.document;

import com.example.beneficiary_system_v2.ai.BeneficiaryData;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.function.Function;

@Service
public class BeneficiaryProfileFusionService {

    private final DocumentRepository documentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BeneficiaryProfileFusionService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    public BeneficiaryProfileResponse fuse(Long workflowId) {
        List<DocumentData> documents = documentRepository.findByWorkflowIdOrderByUploadTimeAsc(workflowId).stream()
                .filter(document -> document.getBeneficiaryJson() != null && !document.getBeneficiaryJson().isBlank())
                .map(this::readDocumentData)
                .toList();
        List<ProfileConflict> conflicts = new ArrayList<>();

        BeneficiaryData fusedData = new BeneficiaryData(
                fuse("fullName", documents, DocumentData::data, BeneficiaryData::fullName, DocumentClassification.AADHAAR, conflicts),
                fuse("aadhaarNumber", documents, DocumentData::data, BeneficiaryData::aadhaarNumber, DocumentClassification.AADHAAR, conflicts),
                fuse("dateOfBirth", documents, DocumentData::data, BeneficiaryData::dateOfBirth, DocumentClassification.AADHAAR, conflicts),
                fuse("gender", documents, DocumentData::data, BeneficiaryData::gender, DocumentClassification.AADHAAR, conflicts),
                fuse("address", documents, DocumentData::data, BeneficiaryData::address, DocumentClassification.AADHAAR, conflicts),
                fuse("state", documents, DocumentData::data, BeneficiaryData::state, DocumentClassification.AADHAAR, conflicts),
                fuse("annualIncome", documents, DocumentData::data, BeneficiaryData::annualIncome, DocumentClassification.INCOME_CERTIFICATE, conflicts),
                fuse("occupation", documents, DocumentData::data, BeneficiaryData::occupation, null, conflicts),
                fuse("student", documents, DocumentData::data, BeneficiaryData::student, DocumentClassification.STUDENT_CERTIFICATE, conflicts),
                fuse("farmer", documents, DocumentData::data, BeneficiaryData::farmer, null, conflicts),
                fuse("category", documents, DocumentData::data, BeneficiaryData::category, DocumentClassification.CASTE_CERTIFICATE, conflicts),
                availableDocuments(documents),
                fuse("panNumber", documents, DocumentData::data, BeneficiaryData::panNumber, DocumentClassification.PAN, conflicts)
        );
        return new BeneficiaryProfileResponse(fusedData, !conflicts.isEmpty(), conflicts);
    }

    private <T> T fuse(
            String field,
            List<DocumentData> documents,
            Function<DocumentData, BeneficiaryData> dataAccessor,
            Function<BeneficiaryData, T> valueAccessor,
            DocumentClassification authoritativeSource,
            List<ProfileConflict> conflicts
    ) {
        List<FieldValue<T>> values = documents.stream()
                .map(document -> new FieldValue<>(valueAccessor.apply(dataAccessor.apply(document)), document.classification()))
                .filter(value -> value.value() != null)
                .toList();
        if (values.isEmpty()) {
            return null;
        }
        if (values.stream().map(FieldValue::value).distinct().count() > 1) {
            conflicts.add(new ProfileConflict(field, values.stream()
                    .distinct()
                    .map(value -> new ConflictValue(value.value(), value.source().name()))
                    .toList()));
        }
        return values.stream()
                .min(Comparator.comparingInt(value -> priority(value.source(), authoritativeSource)))
                .orElseThrow()
                .value();
    }

    private int priority(DocumentClassification source, DocumentClassification authoritativeSource) {
        if (source == authoritativeSource) {
            return 0;
        }
        return source == DocumentClassification.UNKNOWN ? 2 : 1;
    }

    private String availableDocuments(List<DocumentData> documents) {
        LinkedHashSet<String> documentTypes = new LinkedHashSet<>();
        for (DocumentData document : documents) {
            if (document.classification() != DocumentClassification.UNKNOWN) {
                documentTypes.add(document.classification().name());
            }
        }
        return documentTypes.isEmpty() ? null : String.join(",", documentTypes);
    }

    private DocumentData readDocumentData(Document document) {
        try {
            JsonNode json = objectMapper.readTree(document.getBeneficiaryJson());
            String documentTypes = documentTypes(json.get("availableDocuments"));
            BeneficiaryData data = new BeneficiaryData(
                    text(json, "fullName"), text(json, "aadhaarNumber"), text(json, "dateOfBirth"), text(json, "gender"),
                    text(json, "address"), text(json, "state"), decimal(json, "annualIncome"), text(json, "occupation"),
                    bool(json, "student"), bool(json, "farmer"), text(json, "category"), documentTypes, text(json, "panNumber")
            );
            return new DocumentData(data, classification(documentTypes));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not read beneficiary data for document " + document.getId() + ".", exception);
        }
    }

    private static String documentTypes(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isArray()) {
            List<String> values = new ArrayList<>();
            node.forEach(value -> values.add(value.asText()));
            return String.join(",", values);
        }
        return node.asText();
    }

    private static DocumentClassification classification(String documentTypes) {
        if (documentTypes == null || documentTypes.isBlank()) {
            return DocumentClassification.UNKNOWN;
        }
        try {
            return DocumentClassification.valueOf(documentTypes.split(",")[0].trim());
        } catch (IllegalArgumentException exception) {
            return DocumentClassification.UNKNOWN;
        }
    }

    private static String text(JsonNode json, String field) {
        JsonNode value = json.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static BigDecimal decimal(JsonNode json, String field) {
        JsonNode value = json.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.decimalValue();
        }
        String digits = value.asText().replaceAll("\\D", "");
        return digits.isEmpty() ? null : new BigDecimal(digits);
    }

    private static Boolean bool(JsonNode json, String field) {
        JsonNode value = json.get(field);
        return value == null || value.isNull() ? null : value.asBoolean();
    }

    private record DocumentData(BeneficiaryData data, DocumentClassification classification) {
    }

    private record FieldValue<T>(T value, DocumentClassification source) {
    }
}
