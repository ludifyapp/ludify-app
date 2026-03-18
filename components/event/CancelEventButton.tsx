'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface CancelEventButtonProps {
  onCancel: () => Promise<void>
}

export function CancelEventButton({ onCancel }: CancelEventButtonProps) {
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
        Cancel Event
      </Button>
      <Modal
        isOpen={isOpen}
        title="Cancel this event?"
        description="This will cancel the event for all players. This action cannot be undone."
        confirmLabel="Yes, cancel event"
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
        loading={loading}
      />
    </>
  )
}
