import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventStatusBadge } from '@/components/event/EventStatusBadge'
import type { EffectiveStatus } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const statuses: EffectiveStatus[] = ['waiting', 'full', 'ongoing', 'ended', 'cancelled']

describe('EventStatusBadge', () => {
  it.each(statuses)('renders translation key for status "%s"', (status) => {
    render(<EventStatusBadge status={status} />)
    expect(screen.getByText(`eventStatus.${status}`)).toBeInTheDocument()
  })

  it('applies amber class for waiting status', () => {
    const { container } = render(<EventStatusBadge status="waiting" />)
    expect(container.firstChild).toHaveClass('bg-amber-100')
  })

  it('applies sky class for full status', () => {
    const { container } = render(<EventStatusBadge status="full" />)
    expect(container.firstChild).toHaveClass('bg-sky-100')
  })

  it('applies teal class for ongoing status', () => {
    const { container } = render(<EventStatusBadge status="ongoing" />)
    expect(container.firstChild).toHaveClass('bg-teal-100')
  })

  it('applies slate class for ended status', () => {
    const { container } = render(<EventStatusBadge status="ended" />)
    expect(container.firstChild).toHaveClass('bg-slate-100')
  })

  it('applies red class for cancelled status', () => {
    const { container } = render(<EventStatusBadge status="cancelled" />)
    expect(container.firstChild).toHaveClass('bg-red-100')
  })
})
