import { type HTMLAttributes } from 'react'

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'gold' | 'white' | 'charcoal'
  label?: string
}

const sizeMap = {
  sm: 'size-4 border-2',
  md: 'size-7 border-3',
  lg: 'size-10 border-4',
}

const colorMap = {
  primary: 'border-bmc-orange-braise border-t-transparent',
  gold: 'border-bmc-gold border-t-transparent',
  white: 'border-white border-t-transparent',
  charcoal: 'border-zinc-800 border-t-transparent',
}

export function Loader({
  size = 'md',
  color = 'primary',
  label = 'Chargement en cours...',
  className = '',
  ...props
}: LoaderProps) {
  return (
    <div
      role="status"
      className={`inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <div
        className={`animate-spin rounded-full ${sizeMap[size]} ${colorMap[color]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-zinc-200/80 ${className}`}
      {...props}
    />
  )
}
