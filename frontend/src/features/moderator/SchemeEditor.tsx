import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { useSchemeStats } from '@/hooks/useSchemeStats'
import { normalizeApiError } from '@/lib/errors'
import { SCHEME_CATEGORIES } from '@/lib/enums'
import Button from '@/components/Button'
import ErrorMessage from '@/components/ErrorMessage'
import type { SchemeRequest } from '@/lib/types'

const EMPTY: SchemeRequest = {
  schemeName: '',
  category: '',
  description: '',
  benefits: '',
  eligibility: '',
  documentsRequired: '',
  officialLink: '',
  applicationLink: '',
  state: '',
  department: '',
  keywords: '',
  status: 'OPEN',
  launchDate: '',
  eligibilityScore: 0,
  active: true,
  recommendationCount: 0,
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--primary)] mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS = 'w-full border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent'

export default function SchemeEditor() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SchemeRequest>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const { schemes } = useSchemeStats()

  useEffect(() => {
    if (isEdit && schemes) {
      const existing = schemes.find((s) => s.id === Number(id))
      if (existing) {
        setForm({
          schemeName: existing.schemeName,
          category: existing.category,
          description: existing.description,
          benefits: existing.benefits,
          eligibility: existing.eligibility,
          documentsRequired: existing.documentsRequired,
          officialLink: existing.officialLink,
          applicationLink: existing.applicationLink,
          state: existing.state,
          department: existing.department,
          keywords: existing.keywords,
          status: existing.status,
          launchDate: existing.launchDate,
          eligibilityScore: existing.eligibilityScore,
          active: existing.active,
          recommendationCount: existing.recommendationCount,
        })
      }
    }
  }, [isEdit, id, schemes])

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? adminApi.updateScheme(Number(id), form) : adminApi.createScheme(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] })
      navigate('/admin/schemes')
    },
    onError: (err) => setError(normalizeApiError(err)),
  })

  const set = (key: keyof SchemeRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/schemes')} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] text-sm transition-colors">← Back</button>
        <h1 className="font-display text-3xl text-[var(--primary)]">{isEdit ? 'Edit Scheme' : 'New Scheme'}</h1>
      </div>

      <form
        className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-6 space-y-5"
        onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
      >
        <Field label="Scheme Name" required>
          <input className={INPUT_CLASS} value={form.schemeName} onChange={set('schemeName')} required />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Category">
            <select className={INPUT_CLASS} value={form.category} onChange={set('category')}>
              <option value="">Select…</option>
              {SCHEME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={INPUT_CLASS} value={form.status} onChange={set('status')}>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea className={INPUT_CLASS} rows={3} value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Benefits">
          <textarea className={INPUT_CLASS} rows={2} value={form.benefits} onChange={set('benefits')} />
        </Field>
        <Field label="Eligibility">
          <textarea className={INPUT_CLASS} rows={3} value={form.eligibility} onChange={set('eligibility')} />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="State">
            <input className={INPUT_CLASS} value={form.state} onChange={set('state')} placeholder="All India" />
          </Field>
          <Field label="Department">
            <input className={INPUT_CLASS} value={form.department} onChange={set('department')} />
          </Field>
        </div>

        <Field label="Documents Required (comma-separated)">
          <input className={INPUT_CLASS} value={form.documentsRequired} onChange={set('documentsRequired')} placeholder="AADHAAR,INCOME_CERTIFICATE" />
        </Field>
        <Field label="Keywords (comma-separated)">
          <input className={INPUT_CLASS} value={form.keywords} onChange={set('keywords')} placeholder="scholarship,student,education" />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Official Link">
            <input className={INPUT_CLASS} type="url" value={form.officialLink} onChange={set('officialLink')} />
          </Field>
          <Field label="Application Link">
            <input className={INPUT_CLASS} type="url" value={form.applicationLink} onChange={set('applicationLink')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Launch Date">
            <input className={INPUT_CLASS} type="date" value={form.launchDate} onChange={set('launchDate')} />
          </Field>
          <Field label="Eligibility Score">
            <input className={INPUT_CLASS} type="number" min={0} max={100} value={form.eligibilityScore} onChange={set('eligibilityScore')} />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="active"
            type="checkbox"
            checked={form.active}
            onChange={set('active')}
            className="w-4 h-4 accent-[var(--primary)]"
          />
          <label htmlFor="active" className="text-sm text-[var(--foreground)]">Active</label>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/schemes')}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Scheme'}
          </Button>
        </div>
      </form>
    </div>
  )
}
