package com.example.beneficiary_system_v2.document;

import com.example.beneficiary_system_v2.ai.BeneficiaryExtractionService;
import com.example.beneficiary_system_v2.workflow.BeneficiaryWorkflow;
import com.example.beneficiary_system_v2.workflow.BeneficiaryWorkflowRepository;
import com.example.beneficiary_system_v2.workflow.WorkflowScheme;
import com.example.beneficiary_system_v2.workflow.WorkflowSchemeRepository;
import com.example.beneficiary_system_v2.workflow.WorkflowStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final BeneficiaryWorkflowRepository beneficiaryWorkflowRepository;
    private final WorkflowSchemeRepository workflowSchemeRepository;
    private final LocalFileStorageService localFileStorageService;
    private final OcrService ocrService;
    private final DocumentClassificationService documentClassificationService;
    private final BeneficiaryExtractionService beneficiaryExtractionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DocumentService(
            DocumentRepository documentRepository,
            BeneficiaryWorkflowRepository beneficiaryWorkflowRepository,
            WorkflowSchemeRepository workflowSchemeRepository,
            LocalFileStorageService localFileStorageService,
            OcrService ocrService,
            DocumentClassificationService documentClassificationService,
            BeneficiaryExtractionService beneficiaryExtractionService
    ) {
        this.documentRepository = documentRepository;
        this.beneficiaryWorkflowRepository = beneficiaryWorkflowRepository;
        this.workflowSchemeRepository = workflowSchemeRepository;
        this.localFileStorageService = localFileStorageService;
        this.ocrService = ocrService;
        this.documentClassificationService = documentClassificationService;
        this.beneficiaryExtractionService = beneficiaryExtractionService;
    }

    public Document uploadAndProcess(Long workflowId, MultipartFile file) {
        if (!beneficiaryWorkflowRepository.existsById(workflowId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Workflow " + workflowId + " does not exist.");
        }
        WorkflowStatus workflowStatus = beneficiaryWorkflowRepository.findById(workflowId)
                .orElseThrow()
                .getStatus();
        boolean hasSelectedScheme = workflowSchemeRepository.findByWorkflowId(workflowId).stream()
                .anyMatch(WorkflowScheme::isSelected);
        if (workflowStatus.compareTo(WorkflowStatus.SCHEME_SELECTED) < 0 || !hasSelectedScheme) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No scheme has been selected for this workflow; select a scheme before uploading documents."
            );
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A non-empty file is required.");
        }

        Document document = documentRepository.save(Document.builder()
                .workflowId(workflowId)
                .fileName(StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename()))
                .fileType(file.getContentType() == null ? "application/octet-stream" : file.getContentType())
                .fileSize(file.getSize())
                .uploadTime(LocalDateTime.now())
                .status(DocumentStatus.UPLOADED)
                .build());

        try {
            Path storedFile = localFileStorageService.store(file, document.getId());
            String extractedText = ocrService.extractText(storedFile, document.getFileType());
            document.setProcessedDocumentsJson(writeProcessedText(extractedText));
            DocumentClassification classification = documentClassificationService.classify(extractedText);
            if (classification == DocumentClassification.UNKNOWN) {
                document.setStatus(DocumentStatus.OCR_FAILED);
                documentRepository.save(document);
                throw new ResponseStatusException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "Document " + document.getId() + " could not be classified as an unrecognised document type."
                );
            }
            document.setBeneficiaryJson(writeBeneficiaryData(
                    beneficiaryExtractionService.extract(extractedText, classification)
            ));
            document.setStatus(DocumentStatus.CLASSIFIED_AND_EXTRACTED);
            document = documentRepository.save(document);

            BeneficiaryWorkflow workflow = beneficiaryWorkflowRepository.findById(workflowId).orElseThrow();
            workflow.setStatus(WorkflowStatus.DOCUMENTS_UPLOADED);
            workflow.setUpdatedAt(LocalDateTime.now());
            beneficiaryWorkflowRepository.save(workflow);
            return document;
        } catch (IOException | TesseractException exception) {
            document.setStatus(DocumentStatus.OCR_FAILED);
            documentRepository.save(document);
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "OCR processing failed for document " + document.getId() + ": " + exception.getMessage()
            );
        }
    }

    private String writeProcessedText(String extractedText) {
        try {
            return objectMapper.writeValueAsString(Map.of("rawText", extractedText));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize extracted OCR text.", exception);
        }
    }

    private String writeBeneficiaryData(Object beneficiaryData) {
        try {
            return objectMapper.writeValueAsString(beneficiaryData);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize beneficiary data.", exception);
        }
    }
}
