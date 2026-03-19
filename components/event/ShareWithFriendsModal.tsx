'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { auth } from '@/lib/firebase/client'

interface Friend {
  uid: string
  name: string
  photo?: string
}

interface Props {
  eventId: string
  eventName: string
  isOpen: boolean
  onClose: () => void
}

async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken()
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

export function ShareWithFriendsModal({ eventId, eventName, isOpen, onClose }: Props) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [alreadySent, setAlreadySent] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [justSent, setJustSent] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setSelected(new Set())
    setJustSent(new Set())
    setSearch('')

    const load = async () => {
      setLoading(true)
      const [friendsRes, sentRes] = await Promise.all([
        authedFetch('/api/friends'),
        authedFetch(`/api/invites?sent=true&eventId=${eventId}`),
      ])
      const friendsData = await friendsRes.json()
      const sentData = await sentRes.json()

      const uid = auth.currentUser?.uid
      const friendList: Friend[] = (friendsData.friendships ?? [])
        .filter((f: any) => f.status === 'accepted')
        .map((f: any) => {
          const isFrom = f.fromUid === uid
          return {
            uid: isFrom ? f.toUid : f.fromUid,
            name: isFrom ? f.toName : f.fromName,
            photo: isFrom ? f.toPhoto : f.fromPhoto,
          }
        })
        .sort((a: Friend, b: Friend) => a.name.localeCompare(b.name))

      setFriends(friendList)
      setAlreadySent(new Set(sentData.toUids ?? []))
      setLoading(false)
      setTimeout(() => searchRef.current?.focus(), 100)
    }

    load()
  }, [isOpen, eventId])

  const filtered = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (uid: string) => {
    if (alreadySent.has(uid) || justSent.has(uid)) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  const handleSend = async () => {
    if (selected.size === 0) return
    setSending(true)
    try {
      await authedFetch('/api/invites', {
        method: 'POST',
        body: JSON.stringify({ eventId, toUids: Array.from(selected) }),
      })
      setJustSent((prev) => new Set([...prev, ...selected]))
      setSelected(new Set())
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Share with Friends</h2>
          <div className="w-8" />
        </div>

        {/* Search */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends"
              className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 flex-1 outline-none"
            />
          </div>
        </div>

        {/* Friends grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">
              {friends.length === 0 ? 'Add friends to invite them to events' : 'No friends match your search'}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filtered.map((friend) => {
                const sent = alreadySent.has(friend.uid) || justSent.has(friend.uid)
                const isSelected = selected.has(friend.uid)
                return (
                  <button
                    key={friend.uid}
                    onClick={() => toggle(friend.uid)}
                    className="flex flex-col items-center gap-1.5 py-2"
                  >
                    <div className="relative">
                      {friend.photo ? (
                        <Image
                          src={friend.photo}
                          alt={friend.name}
                          width={64}
                          height={64}
                          className={`rounded-full object-cover transition-all ${
                            isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                          } ${sent ? 'opacity-50' : ''}`}
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-semibold text-indigo-700 transition-all ${
                            isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                          } ${sent ? 'opacity-50' : ''}`}
                        >
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {sent && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 text-center leading-tight w-full truncate px-1">
                      {sent ? <span className="text-green-600">Sent</span> : friend.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Send button */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {sending
              ? 'Sending…'
              : selected.size > 0
              ? `Send to ${selected.size} friend${selected.size !== 1 ? 's' : ''}`
              : 'Select friends to invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
