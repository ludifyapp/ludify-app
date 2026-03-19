'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, updateDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/AuthContext'

interface Comment {
  id: string
  uid: string
  name: string
  photoURL: string | null
  text: string
  createdAt: Timestamp | null
  pinned?: boolean
}

interface EventCommentsProps {
  eventId: string
  hostUid: string
  hostName: string
  canComment: boolean
}

function formatRelativeTime(ts: Timestamp): string {
  const diff = Date.now() - ts.toMillis()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
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

export function EventComments({ eventId, hostUid, hostName, canComment }: EventCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [posting, setPosting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isHost = user?.uid === hostUid

  useEffect(() => {
    const q = query(collection(db, 'events', eventId, 'comments'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)))
    })
  }, [eventId])

  const post = async () => {
    if (!text.trim() || !user || !canComment || posting) return
    setPosting(true)
    try {
      await addDoc(collection(db, 'events', eventId, 'comments'), {
        uid: user.uid,
        name: user.displayName ?? 'Anonymous',
        photoURL: user.photoURL ?? null,
        text: text.trim(),
        createdAt: serverTimestamp(),
        pinned: false,
      })
      setText('')
      setFocused(false)
    } finally {
      setPosting(false)
    }
  }

  const cancel = () => { setText(''); setFocused(false) }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post() }
    if (e.key === 'Escape') cancel()
  }

  const deleteComment = (id: string) => deleteDoc(doc(db, 'events', eventId, 'comments', id))
  const togglePin = (comment: Comment) =>
    updateDoc(doc(db, 'events', eventId, 'comments', comment.id), { pinned: !comment.pinned })

  const pinnedComment = comments.find((c) => c.pinned)
  const regularComments = comments.filter((c) => !c.pinned)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Comments</h2>
        {comments.length > 0 && (
          <span className="text-sm text-slate-400 dark:text-zinc-500">{comments.length}</span>
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
              placeholder="Add a comment…"
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
                  Cancel
                </button>
                <button
                  onClick={post}
                  disabled={!text.trim() || posting}
                  className="text-sm font-semibold px-4 py-1.5 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition-colors"
                >
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-zinc-500 italic">
          Join this event to leave a comment
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
              Pinned by {hostName}
            </span>
            {isHost && (
              <button
                onClick={() => togglePin(pinnedComment)}
                className="ml-2 text-xs text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Unpin
              </button>
            )}
          </div>
          <CommentRow
            comment={pinnedComment}
            canDelete={isHost || pinnedComment.uid === user?.uid}
            canPin={false}
            onDelete={() => deleteComment(pinnedComment.id)}
            onPin={() => togglePin(pinnedComment)}
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
          <p className="text-sm text-slate-400 dark:text-zinc-500">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {regularComments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              canDelete={isHost || comment.uid === user?.uid}
              canPin={isHost && !pinnedComment}
              onDelete={() => deleteComment(comment.id)}
              onPin={() => togglePin(comment)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentRow({ comment, canDelete, canPin, onDelete, onPin }: {
  comment: Comment
  canDelete: boolean
  canPin: boolean
  onDelete: () => void
  onPin: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar photoURL={comment.photoURL} name={comment.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{comment.name}</span>
          {comment.createdAt && (
            <span className="text-xs text-slate-400 dark:text-zinc-500">{formatRelativeTime(comment.createdAt)}</span>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">{comment.text}</p>

        {/* Action row */}
        {hovered && (canPin || canDelete) && (
          <div className="flex items-center gap-3 mt-1.5">
            {canPin && (
              <button
                onClick={onPin}
                className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 3a1 1 0 011 1v1h1a1 1 0 010 2h-.5l.5 6H18a3 3 0 01-3 3v4a1 1 0 01-2 0v-4a3 3 0 01-3-3h-.5l.5-6H9a1 1 0 010-2h1V4a1 1 0 011-1h5z"/>
                </svg>
                Pin
              </button>
            )}
            {canDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
