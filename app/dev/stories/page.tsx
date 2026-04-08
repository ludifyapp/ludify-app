import { notFound } from 'next/navigation'
import { StoriesDevClient } from './StoriesDevClient'

export default function StoriesDevPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_DEV_LOGIN !== 'true') {
    notFound()
  }
  return <StoriesDevClient />
}
