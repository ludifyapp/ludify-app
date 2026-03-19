import { notFound } from 'next/navigation'
import { DevLoginClient } from './DevLoginClient'

export default function DevPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_DEV_LOGIN !== 'true') {
    notFound()
  }
  return <DevLoginClient />
}
