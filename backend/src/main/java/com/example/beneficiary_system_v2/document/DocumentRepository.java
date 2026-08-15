package com.example.beneficiary_system_v2.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByWorkflowIdOrderByUploadTimeAsc(Long workflowId);
}
