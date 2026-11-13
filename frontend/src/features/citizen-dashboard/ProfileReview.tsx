import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { workflowsApi } from '@/api/workflows'
import WorkflowShell from './WorkflowShell'
import Button from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import type { Workflow } from '@/lib/types'

function ConflictPanel({ conflicts }: { conflicts: Array<{ field: string; values: Array<{ source: string; value: string }> }> }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[var(--radius)] p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-600">⚠️</span>
        <span className="font-semibold text-amber-800 text-sm">Data conflicts detected</span>
      </div>
      <p className="text-xs text-amber-700 mb-4">
        We found conflicting information in your uploaded documents. Review the differences below and ensure the correct document is uploaded.
      </p>
      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <div key={conflict.field} className="bg-white rounded-md p-3 border border-amber-200">
            <p className="text-xs font-semibold text-amber-900 mb-2">{conflict.field.replace(/_/g, ' ').toUpperCase()}</p>
            <div className="space-y-1">
              {conflict.values.map((v) => (
                <div key={v.source} className="flex justify-between text-xs">
                  <span className="text-amber-700">{v.source}</span>
                  <span className="font-medium text-amber-900">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProfileReview({ workflow }: { workflow: Workflow }) {
  const navigate = useNavigate()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', workflow.id],
    queryFn: () => workflowsApi.getProfile(workflow.id),
  })

  return (
    <WorkflowShell
      workflow={workflow}
      currentStep={3}
      title="Extracted Profile"
      subtitle="Data extracted from your uploaded documents"
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : !profile ? (
        <div className="text-center py-10 text-[var(--muted-foreground)]">
          No profile data found. Please go back and upload documents.
        </div>
      ) : (
        <>
          {profile.conflictDetected && <ConflictPanel conflicts={profile.conflicts} />}

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] divide-y divide-[var(--border)]">
            {Object.entries(profile.beneficiaryData ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between px-5 py-3 gap-4">
                <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-[var(--foreground)] text-right break-all">{String(value ?? '—')}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(`/dashboard/workflow/${workflow.id}/documents`)}>
          ← Back
        </Button>
        <Button onClick={() => navigate(`/dashboard/workflow/${workflow.id}/eligibility`)}>
          Check Eligibility →
        </Button>
      </div>
    </WorkflowShell>
  )
}
