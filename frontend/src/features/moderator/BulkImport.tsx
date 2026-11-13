import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { normalizeApiError } from '@/lib/errors'
import Button from '@/components/Button'
import ErrorMessage from '@/components/ErrorMessage'
import type { ImportResult } from '@/lib/types'

export default function BulkImport() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (f: File) => adminApi.importSchemes(f),
    onSuccess: (res) => {
      setResult(res)
      setFile(null)
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] })
    },
    onError: (err) => setError(normalizeApiError(err)),
  })

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[var(--primary)]">Bulk Import</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Upload a CSV or Excel file to import multiple schemes at once</p>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-6 space-y-5">
        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-[var(--border)] rounded-[var(--radius)] p-10 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition-colors"
          onClick={() => fileRef.current?.click()}
          role="button"
          aria-label="Upload import file"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <div className="text-3xl mb-2">📥</div>
          <p className="font-medium text-sm text-[var(--primary)] mb-1">
            {file ? file.name : 'Select import file'}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">CSV or Excel</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null) }}
          />
        </div>

        {error && <ErrorMessage message={error} />}

        <Button
          loading={mutation.isPending}
          disabled={!file}
          onClick={() => file && mutation.mutate(file)}
          className="w-full"
        >
          {mutation.isPending ? 'Importing…' : 'Import Schemes'}
        </Button>
      </div>

      {/* Import result */}
      {result && (
        <div className="mt-6 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--primary)]">Import Result</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Imported', value: result.imported, color: 'text-green-600' },
              { label: 'Updated', value: result.updated, color: 'text-blue-600' },
              { label: 'Skipped', value: result.skipped, color: 'text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--danger)] mb-2">
                {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
              </h3>
              <div className="border border-red-200 rounded-[var(--radius)] overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-red-700">Row</th>
                      <th className="text-left px-3 py-2 font-semibold text-red-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono">{err.row}</td>
                        <td className="px-3 py-2 text-red-700">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
