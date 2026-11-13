import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { workflowsApi } from '@/api/workflows'
import { normalizeApiError } from '@/lib/errors'
import { updateWorkflowStatus } from '@/lib/storage'
import WorkflowShell from './WorkflowShell'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import ErrorMessage from '@/components/ErrorMessage'
import type { Workflow, GovernmentScheme } from '@/lib/types'

function SchemeCard({
  scheme,
  onSelect,
  selecting,
}: {
  scheme: GovernmentScheme
  onSelect: () => void
  selecting: boolean
}) {
  const docs = scheme.documentsRequired
    ?.split(/[;,]/)
    .map((doc) => doc.trim())
    .filter(Boolean)
    .slice(0, 3) ?? []

  const benefits = scheme.benefits
    ?.split(/\n|•|\r\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3) ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_8px_24px_rgba(10,20,60,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] md:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {scheme.department}
            </p>
            <h3 className="mt-1 text-base font-semibold leading-snug text-[var(--primary)] md:text-lg">
              {scheme.schemeName}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge variant={scheme.status === 'OPEN' ? 'success' : 'muted'} size="sm">
              {scheme.status}
            </Badge>
            {scheme.eligibilityScore > 0 && (
              <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                Match {scheme.eligibilityScore}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="default" size="sm">{scheme.category}</Badge>
          {scheme.level && <Badge variant="accent" size="sm">{scheme.level}</Badge>}
          {scheme.state && <Badge variant="muted" size="sm">{scheme.state}</Badge>}
        </div>

        <p className="mb-4 line-clamp-3 max-h-[72px] overflow-hidden text-sm leading-relaxed text-[var(--muted-foreground)]">
          {scheme.description}
        </p>

        <div className="mt-auto space-y-3">
          <details className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
              <span>Benefits</span>
              <span className="text-[var(--muted-foreground)]">+</span>
            </summary>
            <div className="border-t border-[var(--border)] px-3 py-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {benefits.length > 0 ? (
                <ul className="space-y-1.5">
                  {benefits.map((benefit, index) => (
                    <li key={`${benefit}-${index}`} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{scheme.benefits || 'No benefit details available yet.'}</p>
              )}
            </div>
          </details>

          <details className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
              <span>Eligibility</span>
              <span className="text-[var(--muted-foreground)]">+</span>
            </summary>
            <div className="border-t border-[var(--border)] px-3 py-2 text-xs leading-relaxed text-[var(--muted-foreground)] whitespace-pre-line">
              {scheme.eligibility || 'No eligibility details available yet.'}
            </div>
          </details>

          <details className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
              <span>Documents</span>
              <span className="text-[var(--muted-foreground)]">+</span>
            </summary>
            <div className="border-t border-[var(--border)] px-3 py-2">
              <div className="flex flex-wrap gap-1.5">
                {docs.length > 0 ? (
                  docs.map((doc) => (
                    <Badge key={doc} variant="muted" size="sm">
                      {doc.replace(/_/g, ' ')}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-[var(--muted-foreground)]">No document list provided.</span>
                )}
              </div>
            </div>
          </details>
        </div>

        <div className="mt-5">
          <Button size="sm" loading={selecting} onClick={onSelect} className="w-full justify-center">
            Select This Scheme →
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function RecommendedSchemes({ workflow }: { workflow: Workflow }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectingId, setSelectingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const selectMutation = useMutation({
    mutationFn: (schemeId: number) => workflowsApi.selectScheme(workflow.id, schemeId),
    onSuccess: (updated) => {
      updateWorkflowStatus(workflow.id, updated.status)
      queryClient.setQueryData<Workflow>(['workflow', workflow.id], (prev) =>
        prev ? { ...prev, status: updated.status as Workflow['status'] } : prev,
      )
      navigate(`/dashboard/workflow/${workflow.id}/documents`)
    },
    onError: (err) => setError(normalizeApiError(err)),
    onSettled: () => setSelectingId(null),
  })

  const schemes = workflow.recommendedSchemes ?? []
  const filteredSchemes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return schemes

    return schemes.filter((scheme) => [
      scheme.schemeName,
      scheme.description,
      scheme.category,
      scheme.department,
      scheme.state,
      scheme.keywords,
      scheme.benefits,
    ].some((value) => value?.toLowerCase().includes(query)))
  }, [schemes, search])

  return (
    <WorkflowShell
      workflow={workflow}
      currentStep={1}
      title="Recommended Schemes"
      subtitle={`Based on your need: "${workflow.need}"`}
    >
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      {schemes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-[var(--muted-foreground)] mb-4">No schemes matched your need yet. Try describing it differently.</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Try Again</Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="relative">
            <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recommended schemes…"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] py-3 pl-11 pr-11 text-sm text-[var(--foreground)] shadow-[0_4px_12px_rgba(10,20,60,0.04)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--secondary)] hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--secondary)] px-4 py-3">
            <div>
              <p className="mt-1 text-sm font-medium text-[var(--primary)]">
                {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Badge variant="accent" size="md">{filteredSchemes.length} results</Badge>
          </div>

          {filteredSchemes.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] py-14 text-center">
              <div className="mb-3 text-3xl">🔍</div>
              <p className="font-medium text-[var(--primary)]">No schemes found</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Try a different keyword.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSchemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                onSelect={() => {
                  setSelectingId(scheme.id)
                  selectMutation.mutate(scheme.id)
                }}
                selecting={selectingId === scheme.id && selectMutation.isPending}
              />
              ))}
            </div>
          )}
        </div>
      )}
    </WorkflowShell>
  )
}
