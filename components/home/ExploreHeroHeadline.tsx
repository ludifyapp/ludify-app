'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Part = { prefix: string; highlight: string; suffix: string }
type Variant = { line1: Part; line2: Part }

const VARIANT_COUNT = 5

const gradientStyle: React.CSSProperties = {
  backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-tertiary))',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
}

function renderPart(p: Part) {
  return (
    <>
      {p.prefix}
      {p.highlight && <span style={gradientStyle}>{p.highlight}</span>}
      {p.suffix}
    </>
  )
}

export default function ExploreHeroHeadline() {
  const { t } = useTranslation()
  const [index, setIndex] = useState<number | null>(null)

  useEffect(() => {
    setIndex((prev) => (prev === null ? Math.floor(Math.random() * VARIANT_COUNT) : prev))
  }, [])

  if (index === null) return null

  const variants = t('home.discoverVariants', { returnObjects: true }) as Variant[]
  if (!Array.isArray(variants) || variants.length === 0) return null

  const variant = variants[index] ?? variants[0]

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-6">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] leading-[1.05] text-on-surface text-balance">
        <span className="block whitespace-nowrap">{renderPart(variant.line1)}</span>
        <span className="block">{renderPart(variant.line2)}</span>
      </h1>
    </div>
  )
}
