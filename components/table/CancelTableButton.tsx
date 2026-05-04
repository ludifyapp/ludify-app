'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface CancelTableButtonProps {
  onCancel: () => Promise<void>
}

export function CancelTableButton({ onCancel }: CancelTableButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onCancel()
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Cancel Table
      </Button>
      <Modal
        isOpen={isOpen}
        title="Cancel this table?"
        description="This will cancel the table for all players. This action cannot be undone."
        confirmLabel="Yes, cancel table"
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
        loading={loading}
      />
    </>
  )
}
