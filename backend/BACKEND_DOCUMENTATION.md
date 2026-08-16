# Beneficiary System V2 — Backend Documentation

## Overview

A Spring Boot 4.1 (Java 21) REST API that guides a beneficiary through a multi-step workflow:
1. Express a need in plain text → AI/deterministic intent derivation
2. Receive recommended government schemes
3. Upload identity/income/other documents → OCR + classification + data extraction
4. Evaluate eligibility against the selected scheme
5. Select a scheme and retrieve application instructions

**Base URL:** `http://localhost:8080`  
**Database:** MySQL (`beneficiary_system_v2`)  
**Content-Type:** `application/json` (except document upload which uses `multipart/form-data`)

---

## Workflow Lifecycle

```
CREATED → SCHEMES_RECOMMENDED → SCHEME_SELECTED → DOCUMENTS_REQUIRED → DOCUMENTS_UPLOADED
```

Each status is set automatically as the beneficiary progresses through the API steps.

---

## Endpoints

### 1. Workflows

#### POST /api/workflows
Creates a new workflow. Derives intent from the beneficiary's stated need using Gemini AI (falls back to deterministic matching). Automatically recommends matching schemes.

**Request Body:**
```json
{
  "need": "I am a student and need financial help for my education"
}
```

**Response — 201 Created:**
```json
{
  "id": 1,
  "rawNeed": "I am a student and need financial help for my education",
  "intentJson": "{\"category\":\"Education\",\"beneficiaryType\":\"student\",\"benefitType\":\"scholarship\",\"keywords\":[\"student\",\"education\"]}",
  "status": "SCHEMES_RECOMMENDED",
  "createdAt": "2025-01-01T10:00:00",
  "updatedAt": "2025-01-01T10:00:00"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | `need` field is null or blank |

---

#### GET /api/workflows/{id}
Retrieves a workflow and its recommended schemes.

**Response — 200 OK:**
```json
{
  "workflow": {
    "id": 1,
    "rawNeed": "...",
    "intentJson": "...",
    "status": "SCHEMES_RECOMMENDED",
    "createdAt": "2025-01-01T10:00:00",
    "updatedAt": "2025-01-01T10:00:00"
  },
  "recommendedSchemes": [
    {
      "id": 1,
      "schemeName": "National Scholarship Scheme",
      "category": "Education",
      "description": "...",
      "benefits": "...",
      "eligibility": "...",
      "documentsRequired": "AADHAAR,INCOME_CERTIFICATE,STUDENT_CERTIFICATE",
      "officialLink": "https://scholarships.gov.in/",
      "applicationLink": "https://scholarships.gov.in/",
      "state": "All India",
      "department": "Ministry of Education",
      "keywords": "scholarship,student,education,income",
      "status": "OPEN",
      "eligibilityScore": 80,
      "active": true
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Workflow not found |

---

#### GET /api/workflows/{workflowId}/profile
Returns the fused beneficiary profile extracted from all uploaded documents for this workflow. Detects conflicts when the same field has different values across documents.

**Response — 200 OK:**
```json
{
  "beneficiaryData": {
    "fullName": "Ravi Kumar",
    "aadhaarNumber": "1234 5678 9012",
    "dateOfBirth": "1999-05-15",
    "gender": "Male",
    "address": "123 Main Street, Delhi",
    "state": "Delhi",
    "annualIncome": 150000,
    "occupation": "Student",
    "student": true,
    "farmer": false,
    "category": "General",
    "availableDocuments": "AADHAAR,INCOME_CERTIFICATE,STUDENT_CERTIFICATE",
    "panNumber": null
  },
  "conflictDetected": false,
  "conflicts": []
}
```

If conflicts exist:
```json
{
  "beneficiaryData": { "...": "..." },
  "conflictDetected": true,
  "conflicts": [
    {
      "field": "fullName",
      "values": [
        { "documentId": 1, "documentType": "AADHAAR", "value": "Ravi Kumar" },
        { "documentId": 2, "documentType": "INCOME_CERTIFICATE", "value": "R. Kumar" }
      ]
    }
  ]
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Workflow not found |

---

#### POST /api/workflows/{workflowId}/eligibility/evaluate
Evaluates the beneficiary's eligibility against the recommended schemes using the fused profile. Checks state, gender, age, income, occupation, and document availability.

**Response — 200 OK:**
```json
{
  "workflowId": 1,
  "status": "ELIGIBLE",
  "message": "Beneficiary meets the eligibility criteria.",
  "schemeResults": {
    "stateMatched": true,
    "genderMatched": true,
    "ageMatched": true,
    "incomeMatched": true,
    "occupationMatched": true,
    "documentMatched": true
  },
  "missingFields": [],
  "conflictDetected": false,
  "insufficientInformation": false,
  "conflicts": [],
  "explanation": [
    "State: All India — matched",
    "Income criteria met",
    "Student status confirmed"
  ]
}
```

**EligibilityStatus values:**
| Value | Meaning |
|-------|---------|
| `ELIGIBLE` | Beneficiary meets all criteria |
| `INELIGIBLE` | Beneficiary does not meet one or more criteria |
| `MANUAL_REVIEW` | Conflicts detected; requires human review |
| `INSUFFICIENT_INFORMATION` | Not enough data extracted to make a determination |

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Workflow not found |

---

#### POST /api/workflows/{workflowId}/schemes/{schemeId}/select
Selects a specific recommended scheme for the workflow. Updates workflow status to `SCHEME_SELECTED`.

**Response — 200 OK:**
```json
{
  "workflowId": 1,
  "schemeId": 1,
  "selected": true,
  "status": "SCHEME_SELECTED"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Workflow or scheme not found |
| 400 | Scheme was not recommended for this workflow |

---

#### GET /api/workflows/{workflowId}/application
Returns full application instructions for the selected scheme.

**Response — 200 OK:**
```json
{
  "workflowId": 1,
  "schemeName": "National Scholarship Scheme",
  "benefits": "Annual scholarship assistance for education-related expenses.",
  "eligibilitySummary": "Indian students studying in a recognized institution...",
  "howToApply": "Visit the official portal at https://scholarships.gov.in/ to submit your application online, or contact the Ministry of Education office for offline assistance.",
  "requiredDocuments": ["AADHAAR", "INCOME_CERTIFICATE", "STUDENT_CERTIFICATE"],
  "officialLink": "https://scholarships.gov.in/",
  "applicationLink": "https://scholarships.gov.in/"
}
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 404 | Workflow not found |
| 400 | No scheme has been selected for this workflow |

---

#### GET /api/workflows/{workflowId}/requirements
Returns the list of required documents for the selected scheme.

**Response — 200 OK:**
```json
[
  { "documentType": "AADHAAR", "mandatory": true },
  { "documentType": "INCOME_CERTIFICATE", "mandatory": true },
  { "documentType": "STUDENT_CERTIFICATE", "mandatory": true }
]
```

**Errors:**
| Status | Condition |
|--------|-----------|
| 400 | Workflow not found, no scheme selected, or scheme has no document requirements |

---

### 2. Documents

#### POST /api/documents/upload
Uploads a document file for a workflow. Performs OCR, classifies the document type, and extracts beneficiary data using AI. Supports image files (PNG, JPG) and PDFs.

**Request:** `multipart/form-data`

| Parameter | Type | Description |
|-----------|------|-------------|
| `workflowId` | `Long` | ID of the workflow this document belongs to |
| `file` | `MultipartFile` | The document file to upload |

**Response — 201 Created:**
```json
{
  "id": 1,
  "workflowId": 1,
  "fileName": "aadhaar.png",
  "fileType": "image/png",
  "fileSize": 204800,
  "uploadTime": "2025-01-01T10:05:00",
  "status": "CLASSIFIED_AND_EXTRACTED",
  "processedDocumentsJson": "{\"classification\":\"AADHAAR\", ...}",
  "beneficiaryJson": "{\"fullName\":\"Ravi Kumar\", ...}"
}
```

**DocumentStatus values:**
| Value | Meaning |
|-------|---------|
| `UPLOADED` | File saved, processing not yet started |
| `OCR_PROCESSED` | Text extracted via OCR |
| `CLASSIFIED_AND_EXTRACTED` | Document classified and beneficiary data extracted |
| `OCR_FAILED` | OCR failed or document type could not be recognised |

**DocumentClassification values:**
| Value | Description |
|-------|-------------|
| `AADHAAR` | Aadhaar identity card |
| `PAN` | PAN card |
| `INCOME_CERTIFICATE` | Income certificate |
| `CASTE_CERTIFICATE` | Caste certificate |
| `RESIDENCE_CERTIFICATE` | Residence/domicile certificate |
| `STUDENT_CERTIFICATE` | Student/bonafide certificate |
| `DISABILITY_CERTIFICATE` | Disability certificate |
| `UNKNOWN` | Could not be classified |

**Errors:**
| Status | Condition |
|--------|-----------|
| 422 | Document uploaded but could not be classified (unrecognised document type) |
| 400 | Workflow not found or file is empty/invalid |

---

### 3. Schemes

#### GET /api/schemes
Returns all government schemes in the database.

**Response — 200 OK:**
```json
[
  {
    "id": 1,
    "schemeName": "National Scholarship Scheme",
    "category": "Education",
    "description": "Financial support for eligible students pursuing studies after Class VIII.",
    "benefits": "Annual scholarship assistance for education-related expenses.",
    "eligibility": "Indian students studying in a recognized institution...",
    "documentsRequired": "AADHAAR,INCOME_CERTIFICATE,STUDENT_CERTIFICATE",
    "officialLink": "https://scholarships.gov.in/",
    "applicationLink": "https://scholarships.gov.in/",
    "state": "All India",
    "department": "Ministry of Education",
    "keywords": "scholarship,student,education,income",
    "status": "OPEN",
    "launchDate": "2015-01-01",
    "eligibilityScore": 80,
    "active": true,
    "recommendationCount": 0
  }
]
```

---

## Seeded Schemes

Three schemes are seeded on first startup if the `government_schemes` table is empty:

| Scheme | Category | Documents Required |
|--------|----------|--------------------|
| National Scholarship Scheme | Education | AADHAAR, INCOME_CERTIFICATE, STUDENT_CERTIFICATE |
| Pradhan Mantri Ujjwala Yojana | Social Welfare | AADHAAR, RATION_CARD, BANK_ACCOUNT |
| Ayushman Bharat PM-JAY | Healthcare | AADHAAR, RATION_CARD, FAMILY_ID |

---

## Error Response Format

All errors follow Spring Boot's standard error body (no `message` field):

```json
{
  "timestamp": "2025-01-01T10:00:00.000+00:00",
  "status": 422,
  "error": "Unprocessable Entity",
  "path": "/api/documents/upload"
}
```

---

## Data Models

### BeneficiaryWorkflow
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Auto-generated primary key |
| `rawNeed` | String | Original plain-text need entered by the beneficiary |
| `intentJson` | String | JSON-serialised `WorkflowIntent` derived from the need |
| `status` | WorkflowStatus | Current lifecycle status |
| `createdAt` | LocalDateTime | Creation timestamp |
| `updatedAt` | LocalDateTime | Last update timestamp |

### WorkflowIntent (embedded in `intentJson`)
| Field | Type | Description |
|-------|------|-------------|
| `category` | String | e.g. `"Education"`, `"Healthcare"` |
| `beneficiaryType` | String | e.g. `"student"`, `"farmer"` |
| `benefitType` | String | e.g. `"scholarship"`, `"insurance"` |
| `keywords` | List\<String\> | Matched keywords from the need text |

### Document
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Auto-generated primary key |
| `workflowId` | Long | FK to the parent workflow |
| `fileName` | String | Original uploaded filename |
| `fileType` | String | MIME type |
| `fileSize` | Long | File size in bytes |
| `uploadTime` | LocalDateTime | Upload timestamp |
| `status` | DocumentStatus | Processing status |
| `processedDocumentsJson` | String | Raw classification/OCR result JSON |
| `beneficiaryJson` | String | Extracted `BeneficiaryData` as JSON |

### BeneficiaryData (extracted from documents)
| Field | Type | Description |
|-------|------|-------------|
| `fullName` | String | Full name |
| `aadhaarNumber` | String | 12-digit Aadhaar number |
| `dateOfBirth` | String | Date of birth |
| `gender` | String | Gender |
| `address` | String | Full address |
| `state` | String | State of residence |
| `annualIncome` | BigDecimal | Annual income |
| `occupation` | String | Occupation |
| `student` | Boolean | Is a student |
| `farmer` | Boolean | Is a farmer |
| `category` | String | Social category (General/OBC/SC/ST) |
| `availableDocuments` | String | Comma-separated `DocumentClassification` names |
| `panNumber` | String | PAN card number |

### GovernmentScheme
| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Auto-generated primary key |
| `schemeName` | String | Unique scheme name |
| `category` | String | Scheme category |
| `description` | String | Full description |
| `benefits` | String | Benefits provided |
| `eligibility` | String | Eligibility criteria text |
| `documentsRequired` | String | Comma-separated document type names |
| `officialLink` | String | Official scheme URL |
| `applicationLink` | String | Application portal URL |
| `state` | String | Applicable state (`"All India"` for national) |
| `department` | String | Responsible government department |
| `keywords` | String | Comma-separated keywords for matching |
| `status` | String | `"OPEN"` or `"CLOSED"` |
| `launchDate` | LocalDate | Scheme launch date |
| `eligibilityScore` | Integer | Internal scoring weight |
| `active` | Boolean | Whether the scheme is active |
| `recommendationCount` | Long | Number of times recommended |
| `lastUpdated` | LocalDateTime | Last update timestamp |

---

## AI & Processing Pipeline

### Intent Derivation
1. **Gemini AI** (`GeminiIntentService`) — calls Google Gemini API to parse the beneficiary's need into a structured `WorkflowIntent`
2. **Deterministic fallback** (`DeterministicIntentService`) — keyword-based matching used when Gemini returns `null` or fails

### Document Processing Pipeline (per upload)
1. File saved to local disk (`uploads/` directory)
2. **OCR** (`OcrService`) — Tesseract OCR extracts text from the image/PDF
3. **Classification** (`DocumentClassificationService`) — regex/keyword matching on OCR text determines `DocumentClassification`
4. If classification is `UNKNOWN` → document saved with `status=OCR_FAILED`, HTTP 422 returned
5. **Data Extraction** (`BeneficiaryExtractionService`) — Gemini AI extracts structured `BeneficiaryData` from OCR text
6. Document saved with `status=CLASSIFIED_AND_EXTRACTED`

### Profile Fusion
`BeneficiaryProfileFusionService` merges `BeneficiaryData` from all documents in a workflow into a single profile. When the same field has different values across documents, a `ProfileConflict` is recorded.

### Eligibility Evaluation
`EligibilityRankingService` compares the fused `BeneficiaryData` against the recommended scheme's eligibility criteria, checking: state, gender, age, income, occupation, and document availability.

---

## Configuration

| Property | Default | Description |
|----------|---------|-------------|
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/beneficiary_system_v2` | MySQL connection URL |
| `spring.datasource.username` | `root` | DB username |
| `spring.datasource.password` | `root` | DB password |
| `app.uploads.directory` | `uploads` | Local directory for uploaded files |
| `app.ocr.tessdata-path` | `C:/Program Files/Tesseract-OCR/tessdata` | Tesseract data path |
| `app.gemini.api-key` | *(required via env `GEMINI_API_KEY`)* | Google Gemini API key |

**Environment variable overrides:**
```
APP_UPLOADS_DIRECTORY=./uploads
TESSDATA_PATH=/usr/share/tesseract-ocr/4.00/tessdata
GEMINI_API_KEY=your-api-key-here
```

---

## Typical Happy-Path Flow

```
1.  POST   /api/workflows                              → create workflow, get {id}
2.  GET    /api/workflows/{id}                         → view recommended schemes
3.  POST   /api/documents/upload  (aadhaar file)       → upload & process Aadhaar
4.  POST   /api/documents/upload  (income file)        → upload & process income cert
5.  POST   /api/documents/upload  (student file)       → upload & process student cert
6.  GET    /api/workflows/{id}/profile                 → view fused beneficiary profile
7.  POST   /api/workflows/{id}/eligibility/evaluate    → check eligibility
8.  POST   /api/workflows/{id}/schemes/{schemeId}/select → select a scheme
9.  GET    /api/workflows/{id}/requirements            → list required documents
10. GET    /api/workflows/{id}/application             → get application instructions
```
