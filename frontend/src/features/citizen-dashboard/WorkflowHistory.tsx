import { useNavigate } from 'react-router-dom'
import { getStoredWorkflows } from '@/lib/storage'
import { WORKFLOW_STATUS_LABELS } from '@/lib/enums'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import type { WorkflowStatus } from '@/lib/types'

const STATUS_ROUTES: Record<string, string> = {
  CREATED: 'schemes',
  SCHEMES_RECOMMENDED: 'schemes',
  SCHEME_SELECTED: 'documents',
  DOCUMENTS_REQUIRED: 'documents',
  DOCUMENTS_UPLOADED: 'profile',
}

export default function WorkflowHistory() {
  const navigate = useNavigate()
  const workflows = getStoredWorkflows()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-[var(--primary)]">My Applications</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Your recent welfare scheme searches</p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>+ New Search</Button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-[var(--muted-foreground)] mb-4">No applications yet. Start by describing your need.</p>
          <Button onClick={() => navigate('/dashboard')}>Find Schemes →</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => {
            const route = STATUS_ROUTES[wf.status] ?? 'schemes'
            return (
              <div
                key={wf.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 flex items-center gap-4 hover:border-[var(--primary)] transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/workflow/${wf.id}/${route}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/dashboard/workflow/${wf.id}/${route}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--primary)] truncate">"{wf.need}"</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {new Date(wf.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · ID #{wf.id}
                  </p>
                </div>
                <Badge variant="muted">{WORKFLOW_STATUS_LABELS[wf.status as WorkflowStatus] ?? wf.status}</Badge>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] flex-shrink-0">
                  <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
