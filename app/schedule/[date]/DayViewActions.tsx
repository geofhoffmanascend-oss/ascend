'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  sessionDate: string
  startTime: string
  commitmentId: string | null
  checkedIn: boolean
  isBlocked: boolean
  isCancelled: boolean
}

function isInCheckinWindow(dateStr: string): boolean {
  const classDay = new Date(dateStr)
  const today = new Date()
  return (
    classDay.getUTCFullYear() === today.getFullYear() &&
    classDay.getUTCMonth() === today.getMonth() &&
    classDay.getUTCDate() === today.getDate()
  )
}

export function DayViewActions({ sessionId, sessionDate, startTime, commitmentId: initialCommitmentId, checkedIn: initialCheckedIn, isBlocked, isCancelled }: Props) {
  const [commitmentId, setCommitmentId] = useState(initialCommitmentId)
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn)
  const [working, setWorking] = useState(false)

  const committed = !!commitmentId
  const inWindow = isInCheckinWindow(sessionDate)

  async function toggleCommit() {
    setWorking(true)
    if (committed) {
      await fetch(`/api/commitments/${commitmentId}`, { method: 'DELETE' })
      setCommitmentId(null)
    } else {
      const res = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        const data = await res.json()
        setCommitmentId(data.id)
      }
    }
    setWorking(false)
  }

  async function handleCheckin() {
    setWorking(true)
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    if (res.ok) setCheckedIn(true)
    setWorking(false)
  }

  if (isBlocked || isCancelled) return null

  return (
    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-smoke">
      <button
        onClick={toggleCommit}
        disabled={working}
        className={`text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${
          committed ? 'text-brand-red hover:text-red-700' : 'text-steel hover:text-ink'
        }`}
      >
        {working ? '…' : committed ? 'Registered ✓' : 'Register'}
      </button>

      {committed && inWindow && (
        checkedIn ? (
          <span className="text-sm font-bold text-green-600 uppercase tracking-wide">Checked In ✓</span>
        ) : (
          <button
            onClick={handleCheckin}
            disabled={working}
            className="text-sm font-bold uppercase tracking-wide text-steel hover:text-brand-red transition-colors disabled:opacity-50"
          >
            Check In
          </button>
        )
      )}
    </div>
  )
}
