import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConditionBadge } from '@/components/marketplace/ConditionBadge'
import type { ListingCondition } from '@/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const conditions: ListingCondition[] = ['new', 'like_new', 'good', 'fair', 'poor']

describe('ConditionBadge', () => {
  it.each(conditions)('renders translation key for condition "%s"', (condition) => {
    render(<ConditionBadge condition={condition} />)
    expect(screen.getByText(`condition.${condition}`)).toBeInTheDocument()
  })

  it('applies teal class for new condition', () => {
    const { container } = render(<ConditionBadge condition="new" />)
    expect(container.firstChild).toHaveClass('bg-teal-100')
  })

  it('applies sky class for like_new condition', () => {
    const { container } = render(<ConditionBadge condition="like_new" />)
    expect(container.firstChild).toHaveClass('bg-sky-100')
  })

  it('applies amber class for good condition', () => {
    const { container } = render(<ConditionBadge condition="good" />)
    expect(container.firstChild).toHaveClass('bg-amber-100')
  })

  it('applies orange class for fair condition', () => {
    const { container } = render(<ConditionBadge condition="fair" />)
    expect(container.firstChild).toHaveClass('bg-orange-100')
  })

  it('applies slate class for poor condition', () => {
    const { container } = render(<ConditionBadge condition="poor" />)
    expect(container.firstChild).toHaveClass('bg-slate-100')
  })
})
