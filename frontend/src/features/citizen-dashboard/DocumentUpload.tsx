import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { workflowsApi } from '@/api/workflows'
import { documentsApi } from '@/api/documents'
import { normalizeApiError } from '@/lib/errors'
import { DOCUMENT_CLASSIFICATION_LABELS, DOCUMENT_STATUS_LABELS } from '@/lib/enums'
import WorkflowShell from './WorkflowShell'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import ErrorMessage from '@/components/ErrorMessage'
import type { Workflow, DocumentRequirement, DocumentStatus } from '@/lib/types'

interface UploadedFile {
  name: string
  status: DocumentStatus | 'uploading' | 'unrecognized'
  documentType?: string
  error?: string
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'application/pdf']
const MAX_SIZE_MB = 10

const NOISE_PHRASES = [
  'original to be scanned and uploaded',
  'original to be uploaded',
  'to be scanned and uploaded',
  'duly filled',
  'duly signed',
  'self attested',
  'attested',
  'as per annexure',
  'as per annexure no',
  'annexure',
  'supporting details',
  'in case of',
  'for verifying',
  'for checking',
  'for submission',
  'for official purpose',
  'for this purpose',
  'official purpose',
  'copy of',
  'copy',
  'scanned copy',
  'photocopy',
  'photo copy',
  'supporting document',
]

const normalizeDocumentName = (value: string): string => {
  if (!value) return 'Required Document'

  let cleaned = String(value)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const aliasMap: Record<string, string> = {
    'aadhaar': 'Aadhaar Card',
    'aadhaar card of student': 'Aadhaar Card',
    'aadhaar of student': 'Aadhaar Card',
    'aadhaar card': 'Aadhaar Card',
    'bank pass book': 'Bank Passbook',
    'bank passbook': 'Bank Passbook',
    'pass book': 'Bank Passbook',
    'bank account certificate': 'Bank Account Certificate',
    'bonafide certificate': 'Student / Bonafide Certificate',
    'student certificate': 'Student / Bonafide Certificate',
    'matriculation certificate': 'Matriculation Certificate',
    'educational qualification': 'Educational Qualification / Mark Sheets',
    'educational qualification mark sheets': 'Educational Qualification / Mark Sheets',
    'mark sheets': 'Educational Qualification / Mark Sheets',
    'ppo': 'PPO / ESM Identity Card',
    'esm identity card': 'PPO / ESM Identity Card',
    'category certificate': 'Category Certificate',
    'community caste certificate': 'Community / Caste Certificate',
    'community certificate': 'Community / Caste Certificate',
    'caste certificate': 'Community / Caste Certificate',
    'residence certificate': 'Residence Certificate',
    'income certificate': 'Income Certificate',
    'disability certificate': 'Disability Certificate',
    'pan card': 'PAN Card',
  }

  const lower = cleaned.toLowerCase()
  for (const [alias, canonical] of Object.entries(aliasMap)) {
    if (lower.includes(alias)) {
      return canonical
    }
  }

  cleaned = cleaned
    .replace(/^(?:1st|2nd|3rd|first|second|third|front|back|copy|page|of|the|a|an|self|attested|scanned|original)\s+/i, '')
    .replace(/\(([^)]*)\)/g, ' ')
    .replace(/\s+(?:of|for|in)\s+(?:the\s+)?(?:student|applicant|beneficiary|candidate|parent|guardian|family|household|member|holder|person)\b.*$/i, '')

  for (const phrase of NOISE_PHRASES) {
    cleaned = cleaned.replace(new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), ' ')
  }

  cleaned = cleaned
    .replace(/\s*(?:for\s+(?:verifying|checking|proof|submission|official|identity|eligibility|date\s+of\s+birth|this\s+purpose)|to\s+(?:verify|check|confirm|submit)|in\s+case\s+of.*|as\s+per.*|supporting\s+details.*|duly.*|signed.*|uploaded.*|scanned.*|original.*|copy.*)$/i, '')
    .replace(/\s*[:;|/\\]+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  cleaned = cleaned.replace(/\s*[\-–—:;,.]+\s*.*$/, '')
  cleaned = cleaned.trim()

  if (!cleaned || cleaned.length < 3) return 'Required Document'
  return cleaned.length > 80 ? cleaned.slice(0, 77).trim() + '…' : cleaned
}

const parseDocumentRequirements = (value: string | string[] | undefined): string[] => {
  const rawList = Array.isArray(value) ? value : [value ?? '']

  const parsed = rawList.flatMap((entry) => {
    const text = String(entry ?? '').trim()
    if (!text) return []

    return text
      .split(/(?:\n|;|,|\||\/)/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => normalizeDocumentName(segment))
      .filter((segment) => segment && segment !== 'Required Document')
  })

  return Array.from(new Map(parsed.map((item) => [item.toLowerCase(), item])).values())
}

const matchingUploadKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export default function DocumentUpload({ workflow }: { workflow: Workflow }) {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const requirementsQuery = useQuery({
    queryKey: ['requirements', workflow.id],
    queryFn: async () => {
      console.info('[REQUIREMENTS REQUEST]', { workflowId: workflow.id, selectedSchemeId: workflow.selectedScheme?.id })
      const response = await workflowsApi.getRequirements(workflow.id)
      console.info('[REQUIREMENTS API RESPONSE]', { workflowId: workflow.id, response })
      return response
    },
    enabled: !!workflow.id,
  })

  const applicationQuery = useQuery({
    queryKey: ['application', workflow.id, 'requirements-fallback'],
    queryFn: () => workflowsApi.getApplication(workflow.id),
    enabled: !!workflow.id && requirementsQuery.isError,
  })

  const requirements: DocumentRequirement[] = requirementsQuery.data
    ?? (applicationQuery.data?.requiredDocuments ?? []).map((documentType) => ({ documentType: documentType as DocumentRequirement['documentType'], mandatory: true }))

  console.info('[FRONTEND REQUIRED DOCUMENTS]', { workflowId: workflow.id, requirements })

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setGlobalError('Only PNG, JPG, and PDF files are supported.')
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setGlobalError(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`)
        continue
      }
      setGlobalError(null)
      const entry: UploadedFile = { name: file.name, status: 'uploading' }
      setUploads((prev) => [entry, ...prev])
      try {
        const doc = await documentsApi.upload(workflow.id, file)
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name && u.status === 'uploading'
              ? { name: file.name, status: doc.status, documentType: doc.documentType }
              : u,
          ),
        )
      } catch (err: unknown) {
        const isUnrecognized =
          err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 422
        setUploads((prev) =>
          prev.map((u) =>
            u.name === file.name && u.status === 'uploading'
              ? {
                  name: file.name,
                  status: isUnrecognized ? 'unrecognized' : 'OCR_FAILED',
                  error: isUnrecognized
                    ? "We couldn't recognize this document. Please ensure it's a valid ID or certificate and re-upload."
                    : normalizeApiError(err),
                }
              : u,
          ),
        )
      }
    }
  }

  const successUploads = uploads.filter(
    (u) => u.status === 'CLASSIFIED_AND_EXTRACTED' || u.status === 'OCR_PROCESSED',
  )

  const rawRequirementList = parseDocumentRequirements(
    (requirements ?? []).map((req) => req.documentType ?? req.label ?? ''),
  )

  const normalizedRequirements = rawRequirementList.map((label) => {
    const uploaded = successUploads.some((upload) => {
      if (!upload.documentType) return false
      const uploadKey = matchingUploadKey(upload.documentType)
      const labelKey = matchingUploadKey(label)
      return uploadKey === labelKey || uploadKey.includes(labelKey) || labelKey.includes(uploadKey)
    })

    return {
      documentType: label,
      label,
      mandatory: true,
      uploaded,
    }
  })

  const hasAnySuccessfulUpload = successUploads.length > 0

  const statusVariant = (status: UploadedFile['status']): 'success' | 'warning' | 'danger' | 'muted' => {
    if (status === 'CLASSIFIED_AND_EXTRACTED') return 'success'
    if (status === 'uploading' || status === 'OCR_PROCESSED' || status === 'UPLOADED') return 'muted'
    return 'danger'
  }

  return (
    <WorkflowShell
      workflow={workflow}
      currentStep={2}
      title="Upload Documents"
      subtitle="Upload your documents for automated data extraction"
    >
      {/* Required documents list */}
      {normalizedRequirements.length > 0 && (
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--secondary)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[var(--primary)]">Required documents</h3>
            <span className="text-xs text-[var(--muted-foreground)]">{normalizedRequirements.length} items</span>
          </div>
          <div className="space-y-2">
            {normalizedRequirements.map((req) => {
              const uploaded = hasAnySuccessfulUpload ? (req.uploaded || req.mandatory === false) : false
              const statusText = uploaded ? 'Uploaded' : 'Missing'
              const icon = uploaded ? '✓' : '○'
              return (
                <div
                  key={req.documentType ?? req.label}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">{req.label}</p>
                    {req.mandatory && <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">Mandatory</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${uploaded ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
                      {icon} {statusText}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-[var(--radius-lg)] p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[var(--primary)] bg-[var(--secondary)]' : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--secondary)]'
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        role="button"
        aria-label="Upload documents"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      >
        <div className="text-4xl mb-3">📎</div>
        <p className="font-medium text-[var(--primary)] text-sm mb-1">
          {dragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">PNG, JPG, PDF — up to {MAX_SIZE_MB}MB each</p>
        <input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {globalError && (
        <ErrorMessage message={globalError} onRetry={() => setGlobalError(null)} />
      )}

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="mt-6 space-y-3">
          {uploads.map((u, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 bg-white border border-[var(--border)] rounded-[var(--radius)] p-3"
            >
              <div className="text-xl flex-shrink-0">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">{u.name}</p>
                {u.documentType && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {DOCUMENT_CLASSIFICATION_LABELS[u.documentType as keyof typeof DOCUMENT_CLASSIFICATION_LABELS] ?? u.documentType}
                  </p>
                )}
                {u.error && (
                  <p className="text-xs text-[var(--danger)] mt-1">{u.error}</p>
                )}
              </div>
              <Badge variant={statusVariant(u.status)}>
                {u.status === 'uploading'
                  ? 'Uploading…'
                  : u.status === 'unrecognized'
                    ? 'Unrecognized'
                    : DOCUMENT_STATUS_LABELS[u.status as DocumentStatus] ?? u.status}
              </Badge>
            </motion.div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/dashboard/workflow/${workflow.id}/schemes`)}
        >
          ← Back
        </Button>
        <Button
          disabled={successUploads.length === 0}
          onClick={() => navigate(`/dashboard/workflow/${workflow.id}/profile`)}
        >
          Review Extracted Profile →
        </Button>
      </div>
    </WorkflowShell>
  )
}
