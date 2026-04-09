'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  collection, query, orderBy, onSnapshot,
  deleteDoc, updateDoc, doc, Timestamp,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/client'
import { Analytics } from '@/lib/analytics'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎲']

interface Comment {
  id: string
  uid: string
  name: string
  photoURL: string | null
  text: string
  createdAt: Timestamp | null
  pinned?: boolean
  reactions?: Record<string, string[]>
  isEdited?: boolean
}

interface EventCommentsProps {
  eventId: string
  hostUid: string
  hostName: string
  canComment: boolean
  allowComments?: boolean
}

function formatRelativeTime(ts: Timestamp): string {
  const diff = Date.now() - ts.toMillis()
  const m = Math.floor(diff / 60000)
  if (m < 1) return i18n.t('comments.justNow')
  if (m < 60) return i18n.t('comments.minutesAgo', { count: m })
  const h = Math.floor(m / 60)
  if (h < 24) return i18n.t('comments.hoursAgo', { count: h })
  const d = Math.floor(h / 24)
  if (d < 30) return i18n.t('comments.daysAgo', { count: d })
  return new Date(ts.toMillis()).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function Avatar({ photoURL, name, size = 36 }: { photoURL: string | null; name: string; size?: number }) {
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={name}
        width={size}
        height={size}
        className="rounded-full flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center font-semibold text-teal-700 dark:text-teal-300 flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name[0]?.toUpperCase()}
    </div>
  )
}

export function EventComments({ eventId, hostUid, hostName, canComment, allowComments = true }: EventCommentsProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [posting, setPosting] = useState(false)
  const [muted, setMuted] = useState(false)
  const [muteLoading, setMuteLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isHost = user?.uid === hostUid

  useEffect(() => {
    const q = query(collection(db, 'events', eventId, 'comments'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)))
    })
  }, [eventId])

  // Fetch mute status for this event
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const mutedEvents: string[] = snap.data()?.mutedEvents ?? []
      setMuted(mutedEvents.includes(eventId))
    })
    return unsub
  }, [user, eventId])

  const toggleMute = async () => {
    if (!user || muteLoading) return
    setMuteLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/events/${eventId}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const data = await res.json()
      setMuted(data.muted)
    } finally {
      setMuteLoading(false)
    }
  }

  const post = async () => {
    if (!text.trim() || !user || !canComment || posting) return
    setPosting(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (res.ok) {
        Analytics.commentPosted({ event_id: eventId })
        setText('')
        setFocused(false)
      }
    } finally {
      setPosting(false)
    }
  }

  const cancel = () => { setText(''); setFocused(false) }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post() }
    if (e.key === 'Escape') cancel()
  }

  const deleteComment = (id: string) => {
    Analytics.commentDeleted({ event_id: eventId })
    return deleteDoc(doc(db, 'events', eventId, 'comments', id))
  }
  const togglePin = (comment: Comment) => {
    if (!comment.pinned) Analytics.commentPinned({ event_id: eventId })
    return updateDoc(doc(db, 'events', eventId, 'comments', comment.id), { pinned: !comment.pinned })
  }
  const editComment = (id: string, newText: string) => {
    return updateDoc(doc(db, 'events', eventId, 'comments', id), {
      text: newText,
      isEdited: true
    })
  }

  const toggleReaction = async (commentId: string, emoji: string) => {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return
    // Optimistically determine if this is an add (for analytics)
    const comment = comments.find((c) => c.id === commentId)
    const wasReacted = comment?.reactions?.[emoji]?.includes(user?.uid ?? '') ?? false
    fetch(`/api/events/${eventId}/comments/${commentId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    })
      .then(() => { if (!wasReacted) Analytics.reactionAdded({ event_id: eventId, emoji }) })
      .catch(() => {})
  }

  const pinnedComment = comments.find((c) => c.pinned)
  const regularComments = comments.filter((c) => !c.pinned)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('comments.title')}</h2>
        {comments.length > 0 && (
          <span className="text-sm text-slate-400 dark:text-zinc-500">{comments.length}</span>
        )}
        {user && (
          <button
            onClick={toggleMute}
            disabled={muteLoading}
            title={muted ? t('comments.unmute') : t('comments.mute')}
            className="ml-auto p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {muted ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Input */}
      {canComment ? (
        <div className="flex gap-3">
          <Avatar photoURL={user?.photoURL ?? null} name={user?.displayName ?? '?'} size={36} />
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder={t('comments.addComment')}
              maxLength={500}
              rows={focused ? 3 : 1}
              className="w-full px-0 py-1.5 text-sm bg-transparent border-b-2 border-slate-200 dark:border-zinc-700 focus:border-teal-500 dark:focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none resize-none transition-colors"
            />
            {focused && (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={cancel}
                  className="text-sm font-semibold px-4 py-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  {t('comments.cancel')}
                </button>
                <button
                  onClick={post}
                  disabled={!text.trim() || posting}
                  className="text-sm font-semibold px-4 py-1.5 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition-colors"
                >
                  {posting ? t('comments.posting') : t('comments.post')}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-zinc-500 italic">
          {!allowComments ? t('comments.disabled', 'Comments are disabled for this event') : t('comments.joinToComment')}
        </p>
      )}

      {/* Pinned comment */}
      {pinnedComment && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 3a1 1 0 011 1v1h1a1 1 0 010 2h-.5l.5 6H18a3 3 0 01-3 3v4a1 1 0 01-2 0v-4a3 3 0 01-3-3h-.5l.5-6H9a1 1 0 010-2h1V4a1 1 0 011-1h5z"/>
            </svg>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {t('comments.pinnedBy', { name: hostName })}
            </span>
            {isHost && (
              <button
                onClick={() => togglePin(pinnedComment)}
                className="ml-2 text-xs text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                {t('comments.unpin')}
              </button>
            )}
          </div>
          <CommentRow
            comment={pinnedComment}
            canDelete={isHost || pinnedComment.uid === user?.uid}
            canPin={false}
            currentUid={user?.uid ?? null}
            onDelete={() => deleteComment(pinnedComment.id)}
            onPin={() => togglePin(pinnedComment)}
            onReact={(emoji) => toggleReaction(pinnedComment.id, emoji)}
            onEdit={(text) => editComment(pinnedComment.id, text)}
          />
        </div>
      )}

      {/* Divider between pinned and regular */}
      {pinnedComment && regularComments.length > 0 && (
        <div className="border-t border-slate-100 dark:border-zinc-800" />
      )}

      {/* Regular comments */}
      {regularComments.length === 0 && !pinnedComment ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" className="fill-teal-50 dark:fill-teal-900/20" />
            <path d="M33 16H15a2 2 0 00-2 2v10a2 2 0 002 2h12l5 4v-4h1a2 2 0 002-2V18a2 2 0 00-2-2z" className="fill-teal-100 dark:fill-teal-800/40 stroke-teal-400 dark:stroke-teal-600" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-slate-400 dark:text-zinc-500">{t('comments.noComments')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {regularComments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              canDelete={isHost || comment.uid === user?.uid}
              canPin={isHost && !pinnedComment}
              currentUid={user?.uid ?? null}
              onDelete={() => deleteComment(comment.id)}
              onPin={() => togglePin(comment)}
              onReact={(emoji) => toggleReaction(comment.id, emoji)}
              onEdit={(text) => editComment(comment.id, text)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentRow({ comment, canDelete, canPin, currentUid, onDelete, onPin, onReact, onEdit }: {
  comment: Comment
  canDelete: boolean
  canPin: boolean
  currentUid: string | null
  onDelete: () => void
  onPin: () => void
  onReact: (emoji: string) => void
  onEdit: (text: string) => void
}) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const reactions = comment.reactions ?? {}
  const hasReactions = Object.keys(reactions).length > 0
  const isMyComment = comment.uid === currentUid
  const creationTime = comment.createdAt?.toMillis() ?? 0
  const sevenMinutesPassed = creationTime > 0 && (now - creationTime >= 7 * 60 * 1000)
  const canEdit = isMyComment && sevenMinutesPassed

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onEdit(editText.trim())
    }
    setIsEditing(false)
  }

  return (
    <div
      className={`flex gap-3 ${!isMyComment && currentUid ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (!isMyComment && currentUid && !isEditing) setShowPicker(!showPicker)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowPicker(false) }}
    >
      <Avatar photoURL={comment.photoURL} name={comment.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{comment.name}</span>
          {comment.createdAt && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-zinc-500">{formatRelativeTime(comment.createdAt)}</span>
              {comment.isEdited && (
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 italic">({t('comments.edited', 'Edited')})</span>
              )}
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="mt-1 flex flex-col gap-2">
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-sm bg-transparent border-b border-teal-500 dark:border-teal-500 text-slate-900 dark:text-white focus:outline-none resize-none"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setIsEditing(false); setEditText(comment.text) }}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {t('comments.cancel')}
              </button>
              <button 
                onClick={handleEdit}
                disabled={!editText.trim() || editText === comment.text}
                className="text-sm font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-50"
              >
                {t('comments.save', 'Save')}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed break-words">{comment.text}</p>
        )}

        {/* Existing reactions */}
        {!isEditing && hasReactions && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {REACTION_EMOJIS.filter((e) => reactions[e]?.length).map((emoji) => {
              const mine = currentUid ? reactions[emoji].includes(currentUid) : false
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
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

        {/* Action row */}
        {!isEditing && (hovered || showPicker) && (
          <div className="flex items-center gap-3 mt-1.5 relative">
            {/* Add reaction button */}
            {currentUid && (
              <div className="relative">
                <button
                  onClick={() => setShowPicker((p) => !p)}
                  className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
                  </svg>
                  {t('comments.react')}
                </button>
                {showPicker && (
                  <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 shadow-lg z-10">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { onReact(emoji); setShowPicker(false) }}
                        className="text-lg hover:scale-125 transition-transform leading-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                title={sevenMinutesPassed ? '' : t('comments.waitToEdit', 'Available after 7 min')}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('comments.edit', 'Edit')}
              </button>
            )}
            {canPin && (
              <button
                onClick={onPin}
                className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 3a1 1 0 011 1v1h1a1 1 0 010 2h-.5l.5 6H18a3 3 0 01-3 3v4a1 1 0 01-2 0v-4a3 3 0 01-3-3h-.5l.5-6H9a1 1 0 010-2h1V4a1 1 0 011-1h5z"/>
                </svg>
                {t('comments.pin')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm(t('comments.deleteConfirm', 'Are you sure you want to delete this comment?'))) {
                    onDelete()
                  }
                }}
                className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('comments.delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
