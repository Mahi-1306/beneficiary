import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { workflowsApi } from '@/api/workflows'
import { DOCUMENT_CLASSIFICATION_LABELS } from '@/lib/enums'
import WorkflowShell from './WorkflowShell'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import { Skeleton } from '@/components/Skeleton'
import type { Workflow } from '@/lib/types'

export default function ApplicationGuidance({ workflow }: { workflow: Workflow }) {
  const navigate = useNavigate()

  const { data: guidance, isLoading } = useQuery({
    queryKey: ['application', workflow.id],
    queryFn: () => workflowsApi.getApplication(workflow.id),
  })

  return (
    <WorkflowShell
      workflow={workflow}
      currentStep={5}
      title="How to Apply"
      subtitle="Step-by-step guide to submit your application"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : !guidance ? (
        <p className="text-center text-[var(--muted-foreground)] py-10">Application guidance not available.</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6">
            <h2 className="font-display text-xl text-[var(--primary)] mb-1">{guidance.schemeName}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{guidance.benefits}</p>
          </div>

          <section>
            <h3 className="font-semibold text-[var(--primary)] mb-2">Eligibility Summary</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{guidance.eligibilitySummary}</p>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--primary)] mb-3">Application steps</h3>
            <div className="space-y-3">
              {guidance.howToApply
                .split(/\n|\d+\.|•|\-\s+/)
                .map((step) => step.trim())
                .filter(Boolean)
                .map((step, index) => (
                  <div key={`${step}-${index}`} className="flex gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm text-[var(--foreground)] leading-relaxed">{step}</p>
                  </div>
                ))}
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--primary)] mb-3">Required documents</h3>
            <div className="space-y-2">
              {guidance.requiredDocuments.map((docType) => (
                <div key={docType} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                  <span className="text-sm text-[var(--foreground)]">
                    {DOCUMENT_CLASSIFICATION_LABELS[docType as keyof typeof DOCUMENT_CLASSIFICATION_LABELS] ?? docType}
                  </span>
                  <Badge variant="accent" size="sm">Required</Badge>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-[var(--primary)] mb-3">How to Apply</h3>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] p-4">
              <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">{guidance.howToApply}</p>
            </div>
          </section>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              ↗ The links below take you to the official government portal — you will leave this platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {guidance.applicationLink && /^https?:\/\//i.test(guidance.applicationLink) && (
                <a
                  href={guidance.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#161f48]"
                >
                  Apply on Official Portal ↗
                  <span className="sr-only">(opens official application portal)</span>
                </a>
              )}
              {guidance.officialLink && /^https?:\/\//i.test(guidance.officialLink) && (
                <a
                  href={guidance.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--secondary)]"
                >
                  Official Website ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(`/dashboard/workflow/${workflow.id}/eligibility`)}>
          ← Back
        </Button>
        <Button variant="secondary" onClick={() => navigate('/dashboard/history')}>
          View My Applications
        </Button>
      </div>
    </WorkflowShell>
  )
}
