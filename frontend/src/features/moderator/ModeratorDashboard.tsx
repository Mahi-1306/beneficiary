import { Link } from 'react-router-dom'
import { useSchemeStats } from '@/hooks/useSchemeStats'
import { Skeleton } from '@/components/Skeleton'

function StatTile({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string
  value: number | undefined
  icon: string
  color: string
  loading: boolean
}) {
  return (
    <div className={`bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-sm`}>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-xl mb-4`}>{icon}</div>
      {loading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <div className="text-3xl font-bold text-[var(--primary)] mb-1">{value?.toLocaleString() ?? '—'}</div>
      )}
      <div className="text-sm text-[var(--muted-foreground)]">{label}</div>
    </div>
  )
}

export default function ModeratorDashboard() {
  const { stats, isLoading } = useSchemeStats()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[var(--primary)]">Moderator Dashboard</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Government scheme management overview</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatTile label="Total Schemes" value={stats?.total} icon="📋" color="bg-blue-50" loading={isLoading} />
        <StatTile label="Imported" value={stats?.imported} icon="📥" color="bg-purple-50" loading={isLoading} />
        <StatTile label="Active" value={stats?.active} icon="✅" color="bg-green-50" loading={isLoading} />
        <StatTile label="Verified" value={stats?.verified} icon="🏅" color="bg-amber-50" loading={isLoading} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { to: '/admin/schemes/new', label: 'Create Scheme', desc: 'Add a new government scheme manually', icon: '➕' },
          { to: '/admin/pending', label: 'Review Pending', desc: 'Verify newly imported schemes', icon: '⏳' },
          { to: '/admin/import', label: 'Bulk Import', desc: 'Import schemes from a CSV/Excel file', icon: '📥' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--primary)] hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-3">{action.icon}</div>
            <div className="font-semibold text-[var(--primary)] group-hover:underline">{action.label}</div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">{action.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
