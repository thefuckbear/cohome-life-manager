import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { triggerPlaceholder } from '../lib/placeholder'

type PlaceholderButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  feature: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function PlaceholderButton({
  feature,
  children,
  variant = 'secondary',
  className = '',
  ...props
}: PlaceholderButtonProps) {
  return (
    <button
      type="button"
      className={`button button--${variant} ${className}`.trim()}
      onClick={() => triggerPlaceholder(feature)}
      {...props}
    >
      {children}
    </button>
  )
}
