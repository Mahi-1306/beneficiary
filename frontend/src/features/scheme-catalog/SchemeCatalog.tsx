import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { schemesApi } from '@/api/schemes'
import { SCHEME_CATEGORIES } from '@/lib/enums'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import { CardSkeleton } from '@/components/Skeleton'
import type { GovernmentScheme } from '@/lib/types'

function SchemeCard({ scheme }: { scheme: GovernmentScheme }) {
  const keywords = scheme.keywords?.split(',').filter(Boolean).slice(0, 4) ?? []
  return (
    <Link to={`/schemes/${scheme.id}`} className="block">
      <Card hoverable className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[var(--primary)] text-sm leading-snug mb-1">{scheme.schemeName}</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{scheme.department}</p>
          </div>
          <Badge variant={scheme.status === 'OPEN' ? 'success' : 'muted'}>{scheme.status}</Badge>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] line-clamp-3 leading-relaxed flex-1">{scheme.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <Badge variant="default" size="sm">{scheme.category}</Badge>
          {scheme.state && scheme.state !== 'All India' && (
            <Badge variant="muted" size="sm">{scheme.state}</Badge>
          )}
          {keywords.map((kw) => (
            <Badge key={kw} variant="muted" size="sm">{kw.trim()}</Badge>
          ))}
        </div>
      </Card>
    </Link>
  )
}

export default function SchemeCatalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const selectedCategory = searchParams.get('category') ?? ''

  const { data: schemes, isLoading } = useQuery({
    queryKey: ['schemes'],
    queryFn: schemesApi.list,
  })

  const filtered = useMemo(() => {
    if (!schemes) return []
    return schemes.filter((s) => {
      if (selectedCategory && s.category !== selectedCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.schemeName.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.keywords?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [schemes, selectedCategory, search])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--primary)] mb-2">Government Schemes</h1>
        <p className="text-[var(--muted-foreground)]">Browse and discover welfare programs you may be eligible for</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="search"
          placeholder="Search schemes, keywords, departments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-[var(--border)] rounded-[var(--radius)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
        />
        <select
          value={selectedCategory}
          onChange={(e) => {
            const v = e.target.value
            if (v) setSearchParams({ category: v })
            else setSearchParams({})
          }}
          className="border border-[var(--border)] rounded-[var(--radius)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-w-[160px]"
        >
          <option value="">All Categories</option>
          {SCHEME_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-[var(--muted-foreground)] mb-5">
          {filtered.length} scheme{filtered.length !== 1 ? 's' : ''} found
          {selectedCategory ? ` in ${selectedCategory}` : ''}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
          : filtered.length === 0
            ? (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-[var(--muted-foreground)]">No schemes match your search — try different keywords or clear the category filter.</p>
              </div>
            )
            : filtered.map((s) => <SchemeCard key={s.id} scheme={s} />)}
      </div>
    </div>
  )
}
