'use client'

import { useState } from 'react'

type Student = {
  userId: string
  name: string
  attended: boolean
  isWalkin: boolean
}

export function AttendanceClient({
  sessionId,
  committed,
  existing,
}: {
  sessionId: string
  committed: { userId: string; name: string }[]
  existing: { userId: string; attended: boolean }[]
}) {
  const attendanceMap: Record<string, boolean> = {}
  for (const r of existing) attendanceMap[r.userId] = r.attended
  for (const c of committed) if (!(c.userId in attendanceMap)) attendanceMap[c.userId] = false

  const [attendance, setAttendance] = useState<Record<string, boolean>>(attendanceMap)
  const [saving, setSaving] = useState<string | null>(null)
  const [walkinName, setWalkinName] = useState('')

  async function toggle(userId: string) {
    const next = !attendance[userId]
    setSaving(userId)
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classSessionId: sessionId, userId, attended: next }),
    })
    setAttendance(prev => ({ ...prev, [userId]: next }))
    setSaving(null)
  }

  const students = committed.map(c => ({
    userId: c.userId,
    name: c.name,
    attended: attendance[c.userId] ?? false,
    isWalkin: false,
  }))

  const attended = students.filter(s => s.attended).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">
          Attendance — {attended}/{students.length}
        </p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {students.length === 0 && (
          <p className="text-ash text-sm italic">No committed students.</p>
        )}
        {students.map(s => (
          <label key={s.userId} className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-colors ${
                s.attended ? 'bg-brand-red border-brand-red' : 'border-smoke group-hover:border-steel'
              }`}
              onClick={() => toggle(s.userId)}
            >
              {s.attended && <span className="text-paper text-xs leading-none">✓</span>}
            </div>
            <span
              className={`text-sm transition-colors ${s.attended ? 'text-ink' : 'text-ash'} ${saving === s.userId ? 'opacity-50' : ''}`}
              onClick={() => toggle(s.userId)}
            >
              {s.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
