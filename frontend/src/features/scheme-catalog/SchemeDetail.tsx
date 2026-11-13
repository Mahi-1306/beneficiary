import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { schemesApi } from '@/api/schemes'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'

export default function SchemeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: schemes, isLoading } = useQuery({
    queryKey: ['schemes'],
    queryFn: schemesApi.list,
  })

  const scheme = schemes?.find((s) => s.id === Number(id))

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    )
  }

  if (!scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--muted-foreground)] mb-4">Scheme not found.</p>
        <Link to="/schemes" className="text-[var(--primary)] underline">Back to Schemes</Link>
      </div>
    )
  }

  const docs = scheme.documentsRequired?.split(',').filter(Boolean) ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] mb-6 transition-colors">
        ← Back
      </button>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-[var(--primary)] to-[#2a3a7a] px-8 py-8 text-white">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="accent" size="md">{scheme.category}</Badge>
            <Badge variant={scheme.status === 'OPEN' ? 'success' : 'muted'} size="md">{scheme.status}</Badge>
            {scheme.verified && <Badge variant="success" size="md">✓ Verified</Badge>}
          </div>
          <h1 className="font-display text-3xl mb-2">{scheme.schemeName}</h1>
          <p className="text-white/60 text-sm">{scheme.department} · {scheme.state}</p>
        </div>

        <div className="p-8 space-y-8">
          <Section title="About this Scheme">
            <p className="text-[var(--muted-foreground)] leading-relaxed">{scheme.description}</p>
          </Section>

          <Section title="Benefits">
            <p className="text-[var(--muted-foreground)] leading-relaxed">{scheme.benefits}</p>
          </Section>

          <Section title="Eligibility">
            <p className="text-[var(--muted-foreground)] leading-relaxed">{scheme.eligibility}</p>
          </Section>

          {docs.length > 0 && (
            <Section title="Documents Required">
              <ul className="flex flex-wrap gap-2">
                {docs.map((doc) => (
                  <Badge key={doc} variant="muted" size="md">{doc.trim().replace(/_/g, ' ')}</Badge>
                ))}
              </ul>
            </Section>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border)]">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Check My Eligibility
            </Button>
            {scheme.officialLink && (
              <a
                href={scheme.officialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium rounded-[var(--radius)] border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--secondary)] transition-colors"
              >
                Official Website ↗
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            ↗ Official website links take you away from this platform to the government portal.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-[var(--primary)] mb-2">{title}</h2>
      {children}
    </div>
  )
}
