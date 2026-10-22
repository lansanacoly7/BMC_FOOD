import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

export interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-red-200 bg-red-50/80 p-5 text-left text-red-950 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="rounded-full bg-red-100 p-2 text-bmc-error shrink-0">
          <AlertCircle className="size-5" aria-hidden="true" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-bold text-red-900">{title}</h3>
          <p className="mt-1 text-sm text-red-700 leading-relaxed">{message}</p>

          {onRetry && (
            <div className="mt-3.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RotateCcw className="size-3.5" aria-hidden="true" />}
                className="border-red-300 text-red-800 hover:bg-red-100 bg-white"
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
