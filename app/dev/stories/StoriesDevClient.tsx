'use client'
import { useState } from 'react'
import { FriendStoryOverlay } from '@/components/layout/FriendStoryOverlay'
import { MOCK_STORY_FRIENDS } from '@/lib/mock/friendStories'
import type { FriendDisplayItem } from '@/types'

const ACTIVITY_COLORS: Record<FriendDisplayItem['activity'], string> = {
  ongoing:          'bg-green-400',
  upcoming:         'bg-pink-500',
  upcoming_private: 'bg-green-500',
  recap:            'bg-zinc-500',
}

const ACTIVITY_LABELS: Record<FriendDisplayItem['activity'], string> = {
  ongoing:          'Ongoing',
  upcoming:         'Upcoming',
  upcoming_private: 'Private',
  recap:            'Recap',
}

export function StoriesDevClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // All friends (including recap) go into the overlay
  const storyFriends = MOCK_STORY_FRIENDS

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-2xl font-extrabold mb-1">Friends Story Overlay — Dev</h1>
      <p className="text-zinc-400 text-sm mb-8">
        Click any bubble to open the story overlay at that friend's index.
        Test navigation: tap left/right thirds of the card, use ← → keyboard, or swipe on mobile.
      </p>

      {/* Scenario legend */}
      <div className="flex flex-wrap gap-3 mb-8 text-xs">
        {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${ACTIVITY_COLORS[key as FriendDisplayItem['activity']]}`} />
            <span className="text-zinc-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Friend bubbles */}
      <div className="flex flex-wrap gap-6 mb-12">
        {MOCK_STORY_FRIENDS.map((friend, i) => {
          const isRecap = friend.activity === 'recap'
          const storyIdx = storyFriends.findIndex(f => f.uid === friend.uid)

          return (
            <button
              key={friend.uid}
              onClick={() => storyIdx !== -1 && setOpenIndex(storyIdx)}
              className="flex flex-col items-center gap-2 group"
            >
              {/* Bubble */}
              <div className={`p-[3px] rounded-full ${ACTIVITY_COLORS[friend.activity]}`}>
                <div className="rounded-full bg-zinc-950 p-[2px]">
                  {friend.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={friend.photo}
                      alt={friend.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold text-white">
                      {friend.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <span className="text-[11px] font-semibold text-zinc-300 truncate max-w-[72px] text-center">
                {friend.name.split(' ')[0]}
              </span>

              {/* Event count badge */}
              <span className="text-[10px] text-zinc-500">
                {friend.events.length === 0 ? 'recap' : `${friend.events.length} event${friend.events.length > 1 ? 's' : ''}`}
              </span>

              {/* Scenario label */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${ACTIVITY_COLORS[friend.activity]} text-black`}>
                {ACTIVITY_LABELS[friend.activity]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Scenario table */}
      <div className="max-w-2xl">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Test Scenarios</h2>
        <div className="space-y-2 text-sm">
          {MOCK_STORY_FRIENDS.map((f, i) => (
            <div key={f.uid} className="flex items-start gap-3 py-2 border-b border-zinc-800">
              <span className="text-zinc-600 font-mono w-5 text-right flex-shrink-0">{i + 1}</span>
              <div className="flex-1">
                <span className="font-semibold text-white">{f.name}</span>
                {f.activity === 'recap' && f.recap ? (
                  <span className="text-zinc-500 ml-2">· {f.recap.game.name}{f.recap.winner ? ` 🏆 ${f.recap.winner.split(' ')[0]}` : ''}</span>
                ) : (
                  <>
                    <span className="text-zinc-500 ml-2">{f.events.length} event{f.events.length !== 1 ? 's' : ''}</span>
                    {f.events.length > 0 && (
                      <span className="text-zinc-600 ml-1">· {f.events.map(e => e.boardGame.name).join(', ')}</span>
                    )}
                  </>
                )}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ACTIVITY_COLORS[f.activity]} text-black flex-shrink-0`}>
                {ACTIVITY_LABELS[f.activity]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {openIndex !== null && (
        <FriendStoryOverlay
          friends={storyFriends}
          initialFriendIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  )
}
