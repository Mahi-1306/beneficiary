export type WorkflowStatus =
  | 'CREATED'
  | 'SCHEMES_RECOMMENDED'
  | 'SCHEME_SELECTED'
  | 'DOCUMENTS_REQUIRED'
  | 'DOCUMENTS_UPLOADED'

export type DocumentStatus =
  | 'UPLOADED'
  | 'OCR_PROCESSED'
  | 'CLASSIFIED_AND_EXTRACTED'
  | 'OCR_FAILED'

export type DocumentClassification =
  | 'AADHAAR'
  | 'PAN'
  | 'INCOME_CERTIFICATE'
  | 'CASTE_CERTIFICATE'
  | 'RESIDENCE_CERTIFICATE'
  | 'STUDENT_CERTIFICATE'
  | 'DISABILITY_CERTIFICATE'
  | 'BANK_PASSBOOK'
  | 'FARMER_LAND_RECORD'
  | 'UNKNOWN'

export type EligibilityStatus =
  | 'ELIGIBLE'
  | 'INELIGIBLE'
  | 'MANUAL_REVIEW'
  | 'INSUFFICIENT_INFORMATION'

export interface GovernmentScheme {
  id: number
  schemeName: string
  slug: string
  category: string
  level: string | null
  description: string
  benefits: string
  eligibility: string
  documentsRequired: string
  application: string | null
  officialLink: string
  applicationLink: string
  state: string
  department: string
  keywords: string
  status: 'OPEN' | 'CLOSED'
  launchDate: string
  eligibilityScore: number
  active: boolean
  recommendationCount: number
  lastUpdated: string
  source: 'MANUAL' | 'IMPORTED'
  verified: boolean
}

export interface Workflow {
  id: number
  need: string
  rawNeed?: string
  status: WorkflowStatus
  intentJson?: string | null
  recommendedSchemes?: GovernmentScheme[]
  selectedScheme?: GovernmentScheme | null
  createdAt?: string
  updatedAt?: string
}

export interface WorkflowDetailsResponse {
  workflow: Workflow
  recommendedSchemes: GovernmentScheme[]
}

export interface Document {
  id: number
  workflowId: number
  fileName: string
  documentType: DocumentClassification
  status: DocumentStatus
  beneficiaryJson?: string
  uploadedAt?: string
}

export interface ConflictField {
  field: string
  values: Array<{ documentId?: number; documentType?: string; source?: string; value: string }>
}

export interface BeneficiaryProfile {
  beneficiaryData: Record<string, unknown>
  conflictDetected: boolean
  conflicts: ConflictField[]
}

export interface SchemeResult {
  criterion: string
  matched: boolean
  detail?: string
}

export interface EligibilityCriterion {
  criterion: string
  yourValue: string | null
  requiredValue: string | null
  matched: boolean
  explanation: string | null
}

export interface EligibilityResult {
  workflowId: number
  status: EligibilityStatus
  message?: string
  schemeResults?: Record<string, boolean> | null
  criteria?: EligibilityCriterion[]
  missingFields?: string[] | null
  conflictDetected?: boolean
  insufficientInformation?: boolean
  conflicts?: ConflictField[] | null
  explanation?: string[] | null
}

export interface DocumentRequirement {
  documentType: DocumentClassification
  mandatory: boolean
}

export interface ApplicationGuidance {
  schemeName: string
  benefits: string
  eligibilitySummary: string
  howToApply: string
  requiredDocuments: string[]
  officialLink: string
  applicationLink: string
}

export interface SchemeRequest {
  schemeName: string
  category?: string
  description?: string
  benefits?: string
  eligibility?: string
  documentsRequired?: string
  officialLink?: string
  applicationLink?: string
  state?: string
  department?: string
  keywords?: string
  status?: 'OPEN' | 'CLOSED'
  launchDate?: string
  eligibilityScore?: number
  active?: boolean
  recommendationCount?: number
}

export interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: Array<{ row: number; reason: string }>
}
