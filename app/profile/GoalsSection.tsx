'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Goal = {
  id: string
  description: string
  category: string | null
  targetDate: string | null
  completedAt: string | null
}

const CATEGORIES = ['consistency', 'technique', 'competition', 'fitness', 'mindset'] as const
const CATEGORY_LABELS: Record<string, string> = {
  consistency: 'Consistency', technique: 'Technique', competition: 'Competition',
  fitness: 'Fitness', mindset: 'Mindset',
}

export function GoalsSection({ goals: initial }: { goals: Goal[] }) {
  const router = useRouter()
  const [goals, setGoals] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, category: category || null, targetDate: targetDate || null }),
    })

    if (res.ok) {
      const goal = await res.json()
      setGoals(g => [goal, ...g])
      setDescription('')
      setCategory('')
      setTargetDate('')
      setShowForm(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function toggleComplete(goal: Goal) {
    const completedAt = goal.completedAt ? null : new Date().toISOString()
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedAt }),
    })
    if (res.ok) {
      setGoals(gs => gs.map(g => g.id === goal.id ? { ...g, completedAt } : g))
    }
  }

  async function deleteGoal(id: string) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    setGoals(gs => gs.filter(g => g.id !== id))
  }

  const active = goals.filter(g => !g.completedAt)
  const completed = goals.filter(g => g.completedAt)

  return (
    <div className="border border-smoke bg-paper p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Goals</p>
        <button
          onClick={() => setShowForm(s => !s)}
          className="text-xs font-bold uppercase tracking-widest text-brand-red hover:text-brand-red-dark transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addGoal} className="flex flex-col gap-3 mb-5 pb-5 border-b border-smoke">
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            placeholder="Describe your goal…"
            autoFocus
          />
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            >
              <option value="">Category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
            <button
              type="submit"
              disabled={saving || !description.trim()}
              className="px-5 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
          {category === 'consistency' && (
            <p className="text-xs text-slate">
              Consistency goals pair with your <Link href="/my-training" className="text-brand-red hover:underline">training schedule &amp; streaks</Link>.
            </p>
          )}
        </form>
      )}

      {goals.length === 0 && !showForm && (
        <p className="text-ash text-sm italic">No goals yet.</p>
      )}

      {active.length > 0 && (
        <ul className="flex flex-col gap-3">
          {active.map(goal => (
            <li key={goal.id} className="flex items-start gap-3">
              <button
                onClick={() => toggleComplete(goal)}
                className="mt-0.5 w-4 h-4 border border-smoke flex-shrink-0 hover:border-brand-red transition-colors"
                title="Mark complete"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {goal.category && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-mist text-steel">{CATEGORY_LABELS[goal.category] ?? goal.category}</span>
                  )}
                  <p className="text-ink text-sm">{goal.description}</p>
                </div>
                {goal.category === 'consistency' && (
                  <Link href="/my-training" className="text-brand-red text-xs hover:underline mt-0.5 inline-block">Track streak →</Link>
                )}
                {goal.targetDate && (
                  <p className="text-ash text-xs mt-0.5">
                    Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteGoal(goal.id)}
                className="text-ash hover:text-brand-red transition-colors text-xs flex-shrink-0"
                title="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <div className={active.length > 0 ? 'mt-4 pt-4 border-t border-smoke' : ''}>
          <p className="text-xs text-ash uppercase tracking-wider mb-2">Completed</p>
          <ul className="flex flex-col gap-2">
            {completed.map(goal => (
              <li key={goal.id} className="flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(goal)}
                  className="mt-0.5 w-4 h-4 bg-brand-red flex-shrink-0 flex items-center justify-center"
                  title="Mark incomplete"
                >
                  <span className="text-paper text-xs leading-none">✓</span>
                </button>
                <p className="text-ash text-sm line-through">{goal.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
