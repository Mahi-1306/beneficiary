import type { WorkflowStatus, DocumentStatus, DocumentClassification, EligibilityStatus } from './types'

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  CREATED: 'Created',
  SCHEMES_RECOMMENDED: 'Schemes Recommended',
  SCHEME_SELECTED: 'Scheme Selected',
  DOCUMENTS_REQUIRED: 'Documents Required',
  DOCUMENTS_UPLOADED: 'Documents Uploaded',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  UPLOADED: 'Uploaded',
  OCR_PROCESSED: 'Processing',
  CLASSIFIED_AND_EXTRACTED: 'Extracted',
  OCR_FAILED: 'Failed',
}

export const DOCUMENT_CLASSIFICATION_LABELS: Record<DocumentClassification, string> = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  INCOME_CERTIFICATE: 'Income Certificate',
  CASTE_CERTIFICATE: 'Caste Certificate',
  RESIDENCE_CERTIFICATE: 'Residence Certificate',
  STUDENT_CERTIFICATE: 'Student Certificate',
  DISABILITY_CERTIFICATE: 'Disability Certificate',
  BANK_PASSBOOK: 'Bank Passbook',
  FARMER_LAND_RECORD: 'Farmer/Land Record',
  UNKNOWN: 'Unknown Document',
}

export const ELIGIBILITY_STATUS_LABELS: Record<EligibilityStatus, string> = {
  ELIGIBLE: 'Eligible',
  INELIGIBLE: 'Not Eligible',
  MANUAL_REVIEW: 'Manual Review Required',
  INSUFFICIENT_INFORMATION: 'Insufficient Information',
}

export const ELIGIBILITY_STATUS_COLORS: Record<EligibilityStatus, string> = {
  ELIGIBLE: 'success',
  INELIGIBLE: 'danger',
  MANUAL_REVIEW: 'warning',
  INSUFFICIENT_INFORMATION: 'warning',
}

export const SCHEME_CATEGORIES = [
  'Education',
  'Employment',
  'Agriculture',
  'Housing',
  'Women & Child',
  'Health',
  'Scholarships',
  'Skills',
  'Social Welfare',
]

export const CATEGORY_ICONS: Record<string, string> = {
  Education: '🎓',
  Employment: '💼',
  Agriculture: '🌾',
  Housing: '🏠',
  'Women & Child': '👩‍👧',
  Health: '🏥',
  Scholarships: '📚',
  Skills: '🛠️',
  'Social Welfare': '🤝',
}
