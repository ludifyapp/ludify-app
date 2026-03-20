'use client'
import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { collection, doc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db as clientDb } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase/client'
import { Spinner } from '@/components/ui/Spinner'
import { Analytics } from '@/lib/analytics'
import type { Conversation, DirectMessage } from '@/types'

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [convLoading, setConvLoading] = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/')
  }, [user, authLoading, router])

  // Listen to conversation doc
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(clientDb, 'conversations', id), (d) => {
      if (!d.exists()) { router.replace('/messages'); return }
      const data = { id: d.id, ...d.data() } as Conversation
      if (!data.participants.includes(user.uid)) { router.replace('/messages'); return }
      setConv(data)
      setConvLoading(false)
    })
    return unsub
  }, [id, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to messages
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(clientDb, 'conversations', id, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          uid: data.uid,
          text: data.text,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as DirectMessage
      }))
      setMsgsLoading(false)
    })
    return unsub
  }, [id, user])

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark as read when thread opens
  useEffect(() => {
    if (!user) return
    auth.currentUser?.getIdToken().then((token) => {
      fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    })
  }, [id, user])

  const send = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      const token = await auth.currentUser?.getIdToken()
      await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: trimmed }),
      })
      Analytics.messageSent({ conversation_id: id })
    } catch {
      setText(trimmed) // restore on failure
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (authLoading || convLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8" /></div>
  }

  if (!conv) return null

  const otherUid = conv.participants.find((p) => p !== user!.uid) ?? ''
  const otherName = conv.participantNames?.[otherUid] ?? 'User'
  const otherPhoto = conv.participantPhotos?.[otherUid] ?? ''

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="flex-shrink-0 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <Link href={`/profile/${otherUid}`} className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          {otherPhoto ? (
            <Image src={otherPhoto} alt={otherName} width={36} height={36} className="rounded-full flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-sm font-semibold text-teal-700 dark:text-teal-300 flex-shrink-0">
              {otherName[0]}
            </div>
          )}
          <span className="font-semibold text-slate-900 dark:text-white truncate">{otherName}</span>
        </Link>
      </div>

      {/* Listing context banner */}
      {conv.listingName && (
        <div className="mx-4 mt-3 flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-xl">
          {conv.listingThumbnail && (
            <Image src={conv.listingThumbnail} alt={conv.listingName} width={36} height={36} className="rounded-lg object-contain bg-white dark:bg-zinc-800 p-0.5 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">About listing</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{conv.listingName}</p>
          </div>
          {conv.listingId && (
            <Link href={`/marketplace/listing/${conv.listingId}`} className="flex-shrink-0 text-xs text-teal-600 dark:text-teal-400 hover:underline ml-auto">View</Link>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ paddingBottom: '5rem' }}>
        {msgsLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-5 w-5" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400 dark:text-zinc-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.uid === user!.uid
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-teal-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-100 dark:border-zinc-700 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 px-4 py-3 flex items-end gap-2"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={1000}
          placeholder="Message…"
          className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="flex-shrink-0 w-10 h-10 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors"
        >
          {sending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <svg className="w-4 h-4 translate-x-px" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>
    </main>
  )
}
