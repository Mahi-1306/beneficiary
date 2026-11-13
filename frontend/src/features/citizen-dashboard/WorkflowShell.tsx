import { type ReactNode } from 'react'
import ProgressStepper from '@/components/ProgressStepper'
import type { Workflow } from '@/lib/types'

const STEPS = [
  { label: 'Need', route: 'schemes' },
  { label: 'Schemes', route: 'schemes' },
  { label: 'Documents', route: 'documents' },
  { label: 'Profile', route: 'profile' },
  { label: 'Eligibility', route: 'eligibility' },
  { label: 'Apply', route: 'apply' },
]

const STATUS_TO_STEP: Record<string, number> = {
  CREATED: 1,
  SCHEMES_RECOMMENDED: 1,
  SCHEME_SELECTED: 2,
  DOCUMENTS_REQUIRED: 2,
  DOCUMENTS_UPLOADED: 3,
}

interface WorkflowShellProps {
  workflow: Workflow
  currentStep: number
  title: string
  subtitle?: string
  children: ReactNode
}

export default function WorkflowShell({ workflow, currentStep, title, subtitle, children }: WorkflowShellProps) {
  void workflow

  const steps = STEPS.map((s, i) => ({
    label: s.label,
    status: (i < currentStep ? 'completed' : i === currentStep ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress */}
      <div className="mb-8 overflow-x-auto pb-2">
        <ProgressStepper steps={steps} />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[var(--primary)]">{title}</h1>
        {subtitle && <p className="text-[var(--muted-foreground)] mt-1">{subtitle}</p>}
      </div>

      {children}
    </div>
  )
}

export { STATUS_TO_STEP }
