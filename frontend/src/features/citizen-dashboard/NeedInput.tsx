import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { workflowsApi } from '@/api/workflows'
import { saveWorkflow } from '@/lib/storage'
import { normalizeApiError } from '@/lib/errors'
import Button from '@/components/Button'
import ErrorMessage from '@/components/ErrorMessage'

const EXAMPLES = [
  'I need financial help for my daughter\'s education after class 10',
  'I am a farmer looking for crop insurance or subsidies',
  'I am a widow with two children looking for housing assistance',
  'I want to start a small business and need skill training',
  'I am a disabled person looking for pension support',
]

export default function NeedInput() {
  const [need, setNeed] = useState('')
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: (workflow) => {
      saveWorkflow({
        id: workflow.id,
        need: workflow.need,
        status: workflow.status,
        createdAt: new Date().toISOString(),
      })
      navigate(`/dashboard/workflow/${workflow.id}/schemes`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (need.trim().length < 10) return
    mutation.mutate(need.trim())
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[var(--primary)]/8 rounded-full px-3 py-1 mb-5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--primary)] text-xs font-medium">Step 1 of 8 — Describe your need</span>
          </div>
          <h1 className="font-display text-4xl text-[var(--primary)] mb-3">What do you need help with?</h1>
          <p className="text-[var(--muted-foreground)]">
            Write in your own words — our AI understands natural language. No forms, no jargon.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              placeholder="e.g. I am a 45-year-old farmer in Maharashtra looking for crop loss compensation after floods…"
              rows={4}
              className="w-full border-2 border-[var(--border)] focus:border-[var(--primary)] rounded-[var(--radius-lg)] px-5 py-4 text-sm bg-white resize-none focus:outline-none transition-colors shadow-sm"
              maxLength={1000}
              aria-label="Describe your need"
            />
            <div className="absolute bottom-3 right-4 text-xs text-[var(--muted-foreground)]">
              {need.length}/1000
            </div>
          </div>

          {mutation.error && (
            <ErrorMessage
              message={normalizeApiError(mutation.error)}
              onRetry={() => mutation.reset()}
            />
          )}

          <Button
            type="submit"
            size="lg"
            loading={mutation.isPending}
            disabled={need.trim().length < 10}
            className="w-full"
          >
            {mutation.isPending ? 'Finding matching schemes…' : 'Find My Schemes →'}
          </Button>
        </form>

        {/* Example prompts */}
        <div className="mt-8">
          <p className="text-xs text-[var(--muted-foreground)] mb-3 text-center">Not sure what to write? Try an example:</p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setNeed(ex)}
                className="text-left text-xs px-4 py-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-white hover:bg-[var(--secondary)] hover:border-[var(--primary)] transition-all text-[var(--muted-foreground)] hover:text-[var(--primary)]"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
