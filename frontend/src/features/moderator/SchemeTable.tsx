import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSchemeStats } from '@/hooks/useSchemeStats'
import { adminApi } from '@/api/admin'
import { normalizeApiError } from '@/lib/errors'
import { SCHEME_CATEGORIES } from '@/lib/enums'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import ErrorMessage from '@/components/ErrorMessage'
import type { GovernmentScheme } from '@/lib/types'

function ActionButton({
  label,
  onClick,
  loading,
  variant = 'ghost',
}: {
  label: string
  onClick: () => void
  loading?: boolean
  variant?: 'ghost' | 'danger'
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
        variant === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-[var(--primary)] hover:bg-[var(--secondary)]'
      }`}
    >
      {loading ? '…' : label}
    </button>
  )
}

export default function SchemeTable() {
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const { schemes, isLoading } = useSchemeStats()

  const filtered = schemes?.filter((s) => {
    if (categoryFilter && s.category !== categoryFilter) return false
    if (activeFilter === 'active' && !s.active) return false
    if (activeFilter === 'inactive' && s.active) return false
    return true
  }) ?? []

  async function handleAction(id: number, action: () => Promise<GovernmentScheme>) {
    setLoadingId(id)
    setActionError(null)
    try {
      await action()
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] })
    } catch (err) {
      setActionError(normalizeApiError(err))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--primary)]">Schemes</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{filtered.length} results</p>
        </div>
        <Link to="/admin/schemes/new">
          <Button size="sm">+ New Scheme</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All Categories</option>
          {SCHEME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All States</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {actionError && (
        <div className="mb-4"><ErrorMessage message={actionError} /></div>
      )}

      {/* Table */}
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--secondary)] border-b border-[var(--border)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[var(--primary)] text-xs">Scheme</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--primary)] text-xs">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--primary)] text-xs">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--primary)] text-xs">Active</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--primary)] text-xs">Verified</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--primary)] text-xs">Source</th>
                <th className="text-right px-4 py-3 font-semibold text-[var(--primary)] text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--secondary)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--primary)] max-w-[200px] truncate">{s.schemeName}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{s.department}</div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="default">{s.category}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'OPEN' ? 'success' : 'muted'}>{s.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.active ? 'success' : 'danger'}>{s.active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.verified ? 'success' : 'warning'}>{s.verified ? 'Verified' : 'Pending'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.source === 'IMPORTED' ? 'muted' : 'default'}>{s.source}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/schemes/${s.id}/edit`}>
                            <ActionButton label="Edit" onClick={() => {}} />
                          </Link>
                          <ActionButton
                            label={s.active ? 'Deactivate' : 'Activate'}
                            loading={loadingId === s.id}
                            onClick={() =>
                              handleAction(s.id, () =>
                                s.active ? adminApi.deactivateScheme(s.id) : adminApi.activateScheme(s.id),
                              )
                            }
                          />
                          {!s.verified && (
                            <ActionButton
                              label="Verify"
                              loading={loadingId === s.id}
                              onClick={() => handleAction(s.id, () => adminApi.verifyScheme(s.id))}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--muted-foreground)]">No schemes match the current filters.</div>
        )}
      </div>
    </div>
  )
}
