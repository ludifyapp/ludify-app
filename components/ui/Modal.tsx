'use client'
import { ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  children?: ReactNode
}

export function Modal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading,
  children,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface-container rounded-[1.5rem] card-shadow p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-bold text-on-surface">{title}</h2>
        {description && <p className="mt-2 text-sm text-on-surface-variant">{description}</p>}
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
