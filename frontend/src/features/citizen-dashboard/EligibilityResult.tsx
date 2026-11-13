import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { workflowsApi } from '@/api/workflows'
import { normalizeApiError } from '@/lib/errors'
import WorkflowShell from './WorkflowShell'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import ErrorMessage from '@/components/ErrorMessage'
import type { BeneficiaryProfile, EligibilityCriterion, EligibilityResult as EResult, EligibilityStatus, GovernmentScheme, Workflow } from '@/lib/types'

const STATUS_VARIANT: Record<EligibilityStatus, 'success' | 'danger' | 'warning'> = { ELIGIBLE: 'success', INELIGIBLE: 'danger', MANUAL_REVIEW: 'warning', INSUFFICIENT_INFORMATION: 'warning' }
const CRITERIA = {
  stateMatched: { requirement: 'State', profileField: 'state' }, genderMatched: { requirement: 'Gender', profileField: 'gender' }, ageMatched: { requirement: 'Age', profileField: 'dateOfBirth' }, incomeMatched: { requirement: 'Annual income', profileField: 'annualIncome' }, occupationMatched: { requirement: 'Occupation', profileField: 'occupation' }, studentMatched: { requirement: 'Student', profileField: 'student' }, farmerMatched: { requirement: 'Farmer', profileField: 'farmer' }, documentMatched: { requirement: 'Required documents', profileField: 'availableDocuments' }, categoryMatched: { requirement: 'Category', profileField: 'category' },
} as const
type CriterionKey = keyof typeof CRITERIA
const CRITERION_KEYS: Record<string, CriterionKey> = Object.fromEntries(Object.entries(CRITERIA).map(([key, value]) => [value.requirement, key])) as Record<string, CriterionKey>

function expectedValue(criterion: CriterionKey, scheme?: GovernmentScheme | null): string {
  if (!scheme) return 'Not specified'
  const rules = Object.fromEntries([...(scheme.eligibility ?? '').matchAll(/(state|gender|minAge|maxAge|maxIncome|occupation|documents)\s*=\s*([^;\n]+)/gi)].map(([, key, value]) => [key.toLowerCase(), value.trim()]))
  switch (criterion) {
    case 'stateMatched': return rules.state ?? scheme.state ?? 'Not specified'
    case 'genderMatched': return rules.gender ?? (/women/i.test(scheme.eligibility ?? '') ? 'Female' : 'Not specified')
    case 'ageMatched': return rules.minage && rules.maxage ? `${rules.minage}–${rules.maxage} years` : rules.minage ? `${rules.minage}+ years` : rules.maxage ? `Up to ${rules.maxage} years` : 'Not specified'
    case 'incomeMatched': return rules.maxincome ? `Up to ${rules.maxincome}` : 'Not specified'
    case 'occupationMatched': return rules.occupation ?? 'Not specified'
    case 'documentMatched': return rules.documents ?? scheme.documentsRequired ?? 'Not specified'
  }
}

function actualValue(criterion: CriterionKey, profile?: BeneficiaryProfile): string {
  const value = profile?.beneficiaryData?.[CRITERIA[criterion].profileField]
  return value === null || value === undefined || value === '' ? 'Not specified' : String(value)
}

type Criterion = { criterion: CriterionKey; matched: boolean; expected: string; actual: string; explanation: string }

function CriterionSection({ title, criteria, failedOnly = false }: { title: string; criteria: Criterion[]; failedOnly?: boolean }) {
  return <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]">
    <div className="border-b border-[var(--border)] px-5 py-3"><h3 className="text-sm font-semibold text-[var(--primary)]">{title}</h3></div>
    <div className="divide-y divide-[var(--border)]">
      {criteria.map(({ criterion, matched, expected, actual, explanation }) => <article key={criterion} className="px-5 py-4">
        <div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold text-[var(--foreground)]">{CRITERIA[criterion].requirement}</p><span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${matched ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{matched ? '✓ MATCHED' : '✕ NOT MATCHED'}</span></div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Your value</dt><dd className="mt-0.5 break-words text-[var(--foreground)]">{actual}</dd></div><div><dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Expected / required</dt><dd className="mt-0.5 break-words text-[var(--foreground)]">{expected}</dd></div></dl>
        <p className={`mt-3 text-sm ${failedOnly ? 'text-red-700' : 'text-[var(--muted-foreground)]'}`}>{explanation}</p>
      </article>)}
    </div>
  </section>
}

export default function EligibilityResultPage({ workflow }: { workflow: Workflow }) {
  const navigate = useNavigate()
  const [result, setResult] = useState<EResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: profile } = useQuery({ queryKey: ['profile', workflow.id], queryFn: () => workflowsApi.getProfile(workflow.id), enabled: Boolean(result) })
  const mutation = useMutation({ mutationFn: () => workflowsApi.evaluateEligibility(workflow.id), onSuccess: setResult, onError: (err) => setError(normalizeApiError(err)) })
  const criteria = (result?.criteria ?? []).map((criterion): Criterion | null => {
    if (!criterion) return null
    const key = CRITERION_KEYS[criterion.criterion]
    return key ? { criterion: key, matched: Boolean(criterion.matched), expected: criterion.requiredValue ?? 'Not specified', actual: criterion.yourValue ?? 'Not specified', explanation: criterion.explanation ?? 'No explanation available.' } : null
  }).filter((criterion): criterion is Criterion => criterion !== null)
  const renderedCriteria = criteria.length > 0 ? criteria : Object.entries(result?.schemeResults ?? {}).filter(([criterion]): criterion is CriterionKey => criterion in CRITERIA).map(([criterion, matched]) => ({ criterion, matched: Boolean(matched), expected: expectedValue(criterion, workflow.selectedScheme), actual: actualValue(criterion, profile), explanation: matched ? 'This criterion is satisfied.' : 'This criterion is not satisfied.' }))
  const failedCriteria = renderedCriteria.filter(({ matched }) => !matched)
  const isEligible = result?.status === 'ELIGIBLE'

  return <WorkflowShell workflow={workflow} currentStep={4} title="Eligibility Check" subtitle="We'll evaluate your profile against the selected scheme">
    {!result && !mutation.isPending && <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] py-12 text-center"><div className="mb-4 text-5xl">⚖️</div><h3 className="mb-2 font-semibold text-[var(--primary)]">Ready to evaluate your eligibility</h3><p className="mx-auto mb-6 max-w-sm text-sm text-[var(--muted-foreground)]">This uses data extracted from your documents to check each criterion of the selected scheme.</p>{error && <div className="mx-auto mb-4 max-w-sm"><ErrorMessage message={error} /></div>}<Button size="lg" loading={mutation.isPending} onClick={() => { setError(null); mutation.mutate() }}>Run Eligibility Check</Button></div>}
    {mutation.isPending && <div className="py-12 text-center"><div className="inline-flex items-center gap-3 text-[var(--primary)]"><svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Evaluating eligibility — this may take a few seconds…</div></div>}
    {result && <div className="space-y-6"><div className={`rounded-[var(--radius-lg)] border p-6 ${isEligible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}><div className="flex items-start gap-3"><span className={`text-3xl leading-none ${isEligible ? 'text-green-600' : 'text-red-600'}`}>{isEligible ? '✓' : '✕'}</span><div><Badge variant={STATUS_VARIANT[result.status]} size="md">{isEligible ? 'Eligible' : 'Not eligible'}</Badge><p className="mt-2 text-sm font-medium text-[var(--foreground)]">{isEligible ? 'You meet all eligibility requirements.' : 'You do not currently meet all eligibility requirements.'}</p></div></div>{result.message && <p className="mt-4 text-sm text-[var(--muted-foreground)]">{result.message}</p>}</div>
      {renderedCriteria.length > 0 && <CriterionSection title="Eligibility criteria" criteria={renderedCriteria} />}
      {failedCriteria.length > 0 && <CriterionSection title="Why you're not eligible" criteria={failedCriteria} failedOnly />}
      {(result.missingFields ?? []).length > 0 && <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4"><p className="mb-2 text-sm font-semibold text-amber-800">Missing information</p><ul className="space-y-1 text-sm text-amber-700">{(result.missingFields ?? []).map((field) => <li key={field}>• {field.replace(/_/g, ' ')}</li>)}</ul><Button size="sm" variant="outline" className="mt-3 border-amber-400 text-amber-700 hover:bg-amber-100" onClick={() => navigate(`/dashboard/workflow/${workflow.id}/documents`)}>Upload more documents</Button></div>}
    </div>}
    {result && <div className="mt-8 flex justify-between gap-4"><Button variant="ghost" onClick={() => navigate(`/dashboard/workflow/${workflow.id}/profile`)}>← Back</Button>{(result.status === 'ELIGIBLE' || result.status === 'MANUAL_REVIEW') && <Button onClick={() => navigate(`/dashboard/workflow/${workflow.id}/apply`)}>View Application Guide →</Button>}</div>}
  </WorkflowShell>
}
