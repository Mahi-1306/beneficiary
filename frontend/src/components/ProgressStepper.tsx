interface Step {
  label: string
  status: 'completed' | 'current' | 'upcoming'
}

interface ProgressStepperProps {
  steps: Step[]
}

export default function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center gap-0">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  step.status === 'completed'
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                    : step.status === 'current'
                      ? 'bg-white border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-white border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {step.status === 'completed' ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7l3.5 3.5L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs text-center max-w-[70px] leading-tight ${
                  step.status === 'current'
                    ? 'text-[var(--primary)] font-semibold'
                    : step.status === 'completed'
                      ? 'text-[var(--muted-foreground)]'
                      : 'text-[var(--muted-foreground)]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-5 ${
                  step.status === 'completed' ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                }`}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
