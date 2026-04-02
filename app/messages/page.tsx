'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db as clientDb } from '@/lib/firebase/client'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import type { Conversation } from '@/types'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `${hours}h`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(clientDb, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [user])

  if (authLoading || (!user && loading)) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-sm transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {t('messages.home')}
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('messages.title')}</h1>
          <div className="w-20" />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-semibold text-slate-900 dark:text-white">{t('messages.noMessages')}</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                {t('messages.noMessagesDesc')}
              </p>
              <Link href="/" className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors">
                {t('messages.browseMarketplace')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {conversations.map((conv) => {
                const otherUid = conv.participants.find((p) => p !== user!.uid) ?? ''
                const otherName = conv.participantNames?.[otherUid] ?? 'User'
                const otherPhoto = conv.participantPhotos?.[otherUid] ?? ''
                const unreadCount = conv.unread?.[user!.uid] ?? 0

                return (
                  <li key={conv.id}>
                    <Link href={`/messages/${conv.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                      <div className="relative flex-shrink-0">
                        {otherPhoto ? (
                          <Image src={otherPhoto} alt={otherName} width={44} height={44} className="rounded-full" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-sm font-semibold text-teal-700 dark:text-teal-300">
                            {otherName[0]}
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-teal-500 rounded-full border-2 border-white dark:border-zinc-900 text-[10px] text-white font-bold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${unreadCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-200'}`}>
                            {otherName}
                          </p>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">
                            {timeAgo(conv.lastMessageAt)}
                          </span>
                        </div>
                        {conv.listingName && !conv.lastMessage && (
                          <p className="text-xs text-teal-600 dark:text-teal-400 truncate">re: {conv.listingName}</p>
                        )}
                        {conv.lastMessage && (
                          <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'font-medium text-slate-700 dark:text-zinc-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                            {conv.lastSenderUid === user!.uid ? 'You: ' : ''}{conv.lastMessage}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
