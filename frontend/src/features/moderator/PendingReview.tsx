import { useQueryClient } from '@tanstack/react-query'
import { useQuery, useMutation } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { normalizeApiError } from '@/lib/errors'
import { SCHEME_CATEGORIES } from '@/lib/enums'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import ErrorMessage from '@/components/ErrorMessage'
import { CardSkeleton } from '@/components/Skeleton'
import { useState } from 'react'

export default function PendingReview() {
  const queryClient = useQueryClient()
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: schemes, isLoading } = useQuery({
    queryKey: ['pending-review'],
    queryFn: adminApi.pendingReview,
  })

  async function handleVerify(id: number) {
    setVerifyingId(id)
    setError(null)
    try {
      await adminApi.verifyScheme(id)
      queryClient.invalidateQueries({ queryKey: ['pending-review'] })
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] })
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[var(--primary)]">Pending Review</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Schemes awaiting verification</p>
      </div>

      {error && <div className="mb-5"><ErrorMessage message={error} /></div>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !schemes?.length ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-[var(--muted-foreground)]">No schemes pending review — all up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {schemes.map((s) => (
            <div key={s.id} className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-[var(--primary)] text-sm">{s.schemeName}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.department}</p>
                </div>
                <Badge variant={s.source === 'IMPORTED' ? 'muted' : 'default'}>{s.source}</Badge>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mb-4 line-clamp-2">{s.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="default">{s.category}</Badge>
                <Button
                  size="sm"
                  loading={verifyingId === s.id}
                  onClick={() => handleVerify(s.id)}
                >
                  Verify →
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
