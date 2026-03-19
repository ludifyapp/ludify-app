'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  uid: string
  name: string
  photoURL: string | null
  text: string
  createdAt: Timestamp | null
}

interface EventChatProps {
  eventId: string
  canSend: boolean
}

export function EventChat({ eventId, canSend }: EventChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'events', eventId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)))
    })
  }, [eventId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || !user || !canSend || sending) return
    setSending(true)
    try {
      await addDoc(collection(db, 'events', eventId, 'messages'), {
        uid: user.uid,
        name: user.displayName ?? 'Anonymous',
        photoURL: user.photoURL ?? null,
        text: text.trim(),
        createdAt: serverTimestamp(),
      })
      setText('')
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2">
        <svg className="w-4 h-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <h2 className="font-semibold text-slate-900 dark:text-white">Chat</h2>
        {messages.length > 0 && (
          <span className="ml-auto text-xs text-slate-400 dark:text-zinc-500">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" className="fill-teal-50 dark:fill-teal-900/20" />
              <path d="M28 14H12a2 2 0 00-2 2v8a2 2 0 002 2h10l4 3v-3h2a2 2 0 002-2v-8a2 2 0 00-2-2z" className="fill-teal-100 dark:fill-teal-800/40 stroke-teal-400 dark:stroke-teal-500" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-slate-400 dark:text-zinc-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.uid === user?.uid
            const prevMsg = messages[i - 1]
            const showAvatar = !prevMsg || prevMsg.uid !== msg.uid

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar — only show for first in a group */}
                <div className="w-7 flex-shrink-0">
                  {showAvatar && !isMe && (
                    msg.photoURL ? (
                      <Image src={msg.photoURL} alt={msg.name} width={28} height={28} className="rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {msg.name[0]}
                      </div>
                    )
                  )}
                </div>

                <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && !isMe && (
                    <span className="text-xs text-slate-400 dark:text-zinc-500 px-1">{msg.name}</span>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-teal-500 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.createdAt && (
                    <span className="text-xs text-slate-300 dark:text-zinc-600 px-1">
                      {new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-zinc-800">
        {canSend ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              maxLength={500}
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-zinc-500 text-center italic py-1">
            Join this event to chat
          </p>
        )}
      </div>
    </div>
  )
}
