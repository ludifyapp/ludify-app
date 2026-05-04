import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TableStatusBadge } from '@/components/table/TableStatusBadge'
import type { EffectiveStatus } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const statuses: EffectiveStatus[] = ['waiting', 'full', 'ongoing', 'ended', 'cancelled']

describe('TableStatusBadge', () => {
  it.each(statuses)('renders translation key for status "%s"', (status) => {
    render(<TableStatusBadge status={status} />)
    expect(screen.getByText(`tableStatus.${status}`)).toBeInTheDocument()
  })

  it('applies amber class for waiting status', () => {
    const { container } = render(<TableStatusBadge status="waiting" />)
    expect(container.firstChild).toHaveClass('bg-amber-100')
  })

  it('applies sky class for full status', () => {
    const { container } = render(<TableStatusBadge status="full" />)
    expect(container.firstChild).toHaveClass('bg-sky-100')
  })

  it('applies teal class for ongoing status', () => {
    const { container } = render(<TableStatusBadge status="ongoing" />)
    expect(container.firstChild).toHaveClass('bg-teal-100')
  })

  it('applies slate class for ended status', () => {
    const { container } = render(<TableStatusBadge status="ended" />)
    expect(container.firstChild).toHaveClass('bg-slate-100')
  })

  it('applies red class for cancelled status', () => {
    const { container } = render(<TableStatusBadge status="cancelled" />)
    expect(container.firstChild).toHaveClass('bg-red-100')
  })
})
