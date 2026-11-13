import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export default function Card({ children, className = '', onClick, hoverable }: CardProps) {
  const base =
    'bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
  const hover = hoverable ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(30,42,90,0.12)] hover:border-[var(--primary)] transition-all duration-200' : ''

  return (
    <div className={`${base} ${hover} ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}>
      {children}
    </div>
  )
}
