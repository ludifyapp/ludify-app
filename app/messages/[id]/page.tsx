'use client'
import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, doc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db as clientDb } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase/client'
import { Spinner } from '@/components/ui/Spinner'
import { Analytics } from '@/lib/analytics'
import type { Conversation, DirectMessage } from '@/types'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎲']

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusMsgId = searchParams.get('msg')

  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [convLoading, setConvLoading] = useState(true)
  const [msgsLoading, setMsgsLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null)
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null)
  const hasScrolledToTarget = useRef(false)
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
          text: data.text ?? '',
          type: data.type ?? 'text',
          listing: data.listing ?? undefined,
          reactions: data.reactions ?? undefined,
          createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as DirectMessage
      }))
      setMsgsLoading(false)
    })
    return unsub
  }, [id, user])

  // Scroll to target message (from search) or bottom
  useEffect(() => {
    if (msgsLoading || messages.length === 0) return

    if (focusMsgId && !hasScrolledToTarget.current) {
      hasScrolledToTarget.current = true
      // Small delay to let DOM render
      requestAnimationFrame(() => {
        const el = document.getElementById(`msg-${focusMsgId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightedMsgId(focusMsgId)
          setTimeout(() => setHighlightedMsgId(null), 2500)
        } else {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      })
    } else if (!focusMsgId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, msgsLoading, focusMsgId])

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

  const toggleReaction = async (messageId: string, emoji: string) => {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return
    setReactionPickerMsgId(null)
    fetch(`/api/conversations/${id}/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    }).catch(() => {})
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
            if (msg.type === 'listing' && msg.listing) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-xl w-full max-w-[85%]">
                    {msg.listing.thumbnail && (
                      <Image src={msg.listing.thumbnail} alt={msg.listing.name} width={36} height={36} className="rounded-lg object-contain bg-white dark:bg-zinc-800 p-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">About listing</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{msg.listing.name}</p>
                    </div>
                    <Link href={`/marketplace/listing/${msg.listing.id}`} className="flex-shrink-0 text-xs text-teal-600 dark:text-teal-400 hover:underline ml-auto">View</Link>
                  </div>
                </div>
              )
            }
            const isMe = msg.uid === user!.uid
            const reactions = msg.reactions ?? {}
            const hasReactions = Object.keys(reactions).some((e) => reactions[e]?.length > 0)
            const isHighlighted = highlightedMsgId === msg.id
            return (
              <div key={msg.id} id={`msg-${msg.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group transition-colors duration-700 rounded-xl ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}>
                <div className="relative max-w-[75%]">
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-teal-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-100 dark:border-zinc-700 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Reaction picker toggle */}
                  <button
                    onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                    className={`absolute -bottom-2 ${
                      isMe ? 'left-0 -translate-x-full -ml-1' : 'right-0 translate-x-full ml-1'
                    } opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 text-xs p-1 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm`}
                    aria-label="Add reaction"
                  >
                    😊
                  </button>

                  {/* Emoji picker dropdown */}
                  {reactionPickerMsgId === msg.id && (
                    <div className={`absolute z-20 ${
                      isMe ? 'right-0' : 'left-0'
                    } -bottom-10 flex gap-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full px-2 py-1 shadow-lg`}>
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className="text-base hover:scale-125 transition-transform px-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Existing reactions */}
                  {hasReactions && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {REACTION_EMOJIS.filter((e) => reactions[e]?.length).map((emoji) => {
                        const mine = user ? reactions[emoji].includes(user.uid) : false
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                              mine
                                ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                                : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-teal-300 dark:hover:border-teal-700'
                            }`}
                          >
                            {emoji} {reactions[emoji].length}
                          </button>
                        )
                      })}
                    </div>
                  )}
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
