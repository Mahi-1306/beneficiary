import { type ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

export default function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--secondary)] text-[var(--primary)]',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    accent: 'bg-[var(--accent)] text-[var(--accent-foreground)]',
    muted: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-3 py-1 text-sm font-medium',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  )
}
