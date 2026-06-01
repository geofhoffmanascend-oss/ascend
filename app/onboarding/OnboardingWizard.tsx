'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GymPicker } from '@/app/components/GymPicker'
import { GymForumPrompt } from '@/app/components/GymForumPrompt'

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const
type Belt = typeof BELTS[number]

const CLASS_GROUPS = [
  { key: 'grappling', label: 'Grappling', sub: 'Gi, No-Gi, Open Mat' },
  { key: 'striking',  label: 'Striking',  sub: 'Muay Thai, Self-Defense' },
  { key: 'kids',      label: 'Kids',      sub: 'Kids classes' },
  { key: 'competition', label: 'Competition Team', sub: 'Competition prep' },
  { key: 'seminar',   label: 'Seminars',  sub: 'Special events' },
] as const

type ClassGroupKey = typeof CLASS_GROUPS[number]['key']

interface Props {
  userId: string
  userName: string
  userBelt: Belt
  userStripes: number
  redirectAfter: string
  initialGymId?: string | null
  initialGymName?: string | null
}

const TOTAL_STEPS = 6

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i + 1 === current
              ? 'bg-brand-red'
              : i + 1 < current
              ? 'bg-steel'
              : 'bg-smoke'
          }`}
        />
      ))}
    </div>
  )
}

export function OnboardingWizard({ userId, userName, userBelt, userStripes, redirectAfter, initialGymId, initialGymName }: Props) {
  const router = useRouter()

  // Returning from "Add my gym" (/gyms/register?returnTo=onboarding): the gym was
  // already created and the creator auto-joined as an active member (see POST /api/gyms).
  // Step 1 was completed before they left (its values are persisted and re-passed via props),
  // so skip straight to the gym-forum sub-step instead of restarting at step 1 and re-prompting
  // for a gym they just created.
  const returningFromRegister = Boolean(initialGymId && initialGymName)

  const [step, setStep] = useState(returningFromRegister ? 2 : 1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [name, setName] = useState(userName || '')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [belt, setBelt] = useState<Belt>(userBelt || 'white')
  const [stripes, setStripes] = useState(userStripes || 0)

  // Step 2 — gym
  const [selectedGym, setSelectedGym] = useState<{ id: string; name: string } | null>(
    returningFromRegister ? { id: initialGymId!, name: initialGymName! } : null
  )
  const [showGymForumPrompt, setShowGymForumPrompt] = useState(returningFromRegister)
  const [justCreatedGym, setJustCreatedGym] = useState(returningFromRegister)

  // Step 3
  const [phone, setPhone] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')

  // Step 4 — checked = shown on schedule; unchecked = hidden
  const [checkedGroups, setCheckedGroups] = useState<Set<ClassGroupKey>>(
    new Set(CLASS_GROUPS.map(g => g.key))
  )

  // Step 5
  const [whyStarted, setWhyStarted] = useState('')
  const [challenges, setChallenges] = useState('')
  const [goals, setGoals] = useState('')

  function toggleGroup(key: ClassGroupKey) {
    setCheckedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Save failed')
  }

  async function saveStep1() {
    await patch({ name: name || undefined, avatarUrl: avatarUrl || undefined, belt, stripes })
  }

  async function saveStep2() {
    if (!selectedGym) return
    await fetch(`/api/gyms/${selectedGym.id}/membership`, { method: 'PUT' })
  }

  async function saveStep3() {
    await patch({ phone: phone || undefined, emergencyContact: emergencyContact || undefined })
  }

  async function saveStep4() {
    const hiddenClassGroups = CLASS_GROUPS
      .map(g => g.key)
      .filter(k => !checkedGroups.has(k))
    await patch({ hiddenClassGroups })
  }

  async function saveStep5() {
    if (!whyStarted && !challenges && !goals) return
    const res = await fetch('/api/reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whyStarted, challenges, goals }),
    })
    if (!res.ok) throw new Error('Reflection save failed')
  }

  async function complete() {
    await patch({ onboardingDone: true, onboardedRoles: ['student'] })
    router.push(redirectAfter)
    router.refresh()
  }

  async function handleNext(saveFn?: () => Promise<void>) {
    setSaving(true)
    setError('')
    try {
      if (saveFn) await saveFn()
      setStep(s => s + 1)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    setStep(s => s + 1)
  }

  const inputCls = 'w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-steel'
  const primaryBtn = 'px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60'
  const secondaryBtn = 'px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors'

  return (
    <div>
      <StepDots current={step} />

      <div className="border border-smoke bg-paper p-8">
        {/* ── Step 1: Basic Profile ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 1 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Welcome — let's set up your profile</h2>
              <p className="text-sm text-slate">All fields are optional. You can edit this later.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Avatar URL <span className="normal-case font-normal text-ash">(optional)</span></label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Belt</label>
                <select
                  value={belt}
                  onChange={e => setBelt(e.target.value as Belt)}
                  className={inputCls}
                >
                  {BELTS.map(b => (
                    <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Stripes</label>
                <select
                  value={stripes}
                  onChange={e => setStripes(Number(e.target.value))}
                  className={inputCls}
                >
                  {[0, 1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-ash border border-smoke bg-mist px-3 py-2">
              Your belt is self-reported. A gym admin can verify it once you join a gym — verified belts show a checkmark on your profile and forum posts.
            </p>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-end">
              <button
                onClick={() => handleNext(saveStep1)}
                disabled={saving}
                className={primaryBtn}
              >
                {saving ? 'Saving…' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Your Gym ── */}
        {step === 2 && !showGymForumPrompt && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Which gym do you train at?</h2>
              <p className="text-sm text-slate">Search by name, city, or instructor. You can change this later.</p>
            </div>

            <GymPicker
              value={selectedGym}
              onChange={gym => { setSelectedGym(gym); setJustCreatedGym(false) }}
              onCreateNew={gymName => {
                router.push(`/gyms/register?returnTo=onboarding&name=${encodeURIComponent(gymName)}`)
              }}
            />

            {selectedGym && (
              <div className="flex items-center gap-2 px-4 py-3 bg-mist border border-smoke text-sm text-ink">
                <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{selectedGym.name}</span>
              </div>
            )}

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>← Back</button>
              <div className="flex gap-3">
                <button onClick={() => setStep(s => s + 1)} className={secondaryBtn}>I train independently</button>
                <button
                  onClick={async () => {
                    if (selectedGym) {
                      setSaving(true)
                      setError('')
                      try {
                        await saveStep2()
                        setShowGymForumPrompt(true)
                      } catch {
                        setError('Failed to save. Please try again.')
                      } finally {
                        setSaving(false)
                      }
                    } else {
                      setStep(s => s + 1)
                    }
                  }}
                  disabled={saving}
                  className={primaryBtn}
                >
                  {saving ? 'Saving…' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2 sub-step: Gym Forum ── */}
        {step === 2 && showGymForumPrompt && selectedGym && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Connect with your training partners</h2>
            </div>
            {justCreatedGym && (
              <div className="flex items-center gap-2 px-4 py-3 bg-mist border border-smoke text-sm text-ink">
                <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>You created <strong>{selectedGym.name}</strong> — you're now a member.</span>
              </div>
            )}
            <GymForumPrompt
              gymId={selectedGym.id}
              gymName={selectedGym.name}
              onDone={() => {
                setShowGymForumPrompt(false)
                setStep(s => s + 1)
              }}
            />
            <div>
              <button onClick={() => { setShowGymForumPrompt(false); setJustCreatedGym(false) }} className={secondaryBtn}>← Back</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Contact Info ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 3 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Contact info</h2>
              <p className="text-sm text-slate">Used for emergency situations and gym communication. Both optional.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={inputCls}
                placeholder="(555) 000-0000"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                className={inputCls}
                placeholder="Name — (555) 000-0000"
              />
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>← Back</button>
              <div className="flex gap-3">
                <button onClick={handleSkip} className={secondaryBtn}>Skip</button>
                <button
                  onClick={() => handleNext(saveStep3)}
                  disabled={saving}
                  className={primaryBtn}
                >
                  {saving ? 'Saving…' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Schedule Preferences ── */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 4 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Which classes do you normally attend?</h2>
              <p className="text-sm text-slate">Classes from unchecked groups will be hidden from your schedule. You can change this in Settings.</p>
            </div>

            <div className="flex flex-col gap-3">
              {CLASS_GROUPS.map(g => (
                <label key={g.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedGroups.has(g.key)}
                    onChange={() => toggleGroup(g.key)}
                    className="mt-0.5 w-4 h-4 accent-brand-red"
                  />
                  <div>
                    <div className="text-sm font-medium text-ink">{g.label}</div>
                    <div className="text-xs text-slate">{g.sub}</div>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>← Back</button>
              <div className="flex gap-3">
                <button onClick={handleSkip} className={secondaryBtn}>Skip</button>
                <button
                  onClick={() => handleNext(saveStep4)}
                  disabled={saving}
                  className={primaryBtn}
                >
                  {saving ? 'Saving…' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Training Reflection ── */}
        {step === 5 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 5 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">A few questions to help you get the most from your training</h2>
              <p className="text-sm text-slate">Your answers are private by default — only you can see them. You can share them later from your profile.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Why did you start training Jiu-Jitsu?</label>
              <textarea
                value={whyStarted}
                onChange={e => setWhyStarted(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="What brought you to the mat?"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>What challenges or obstacles have you faced — and how can you overcome them?</label>
              <textarea
                value={challenges}
                onChange={e => setChallenges(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Injuries, consistency, nerves, schedule..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>What are your goals? What are you hoping to learn or achieve?</label>
              <textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Compete, get fit, self-defense, earn my blue belt..."
              />
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>← Back</button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleNext()}
                  className={secondaryBtn}
                >
                  Skip for now
                </button>
                <button
                  onClick={() => handleNext(saveStep5)}
                  disabled={saving}
                  className={primaryBtn}
                >
                  {saving ? 'Saving…' : 'Save Reflection →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 6: Completion ── */}
        {step === 6 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 6 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-2xl text-ink mb-2">You're all set!</h2>
              <p className="text-sm text-slate">Welcome to AscendIt. Here are a few places to start.</p>
            </div>

            <div className="flex flex-col gap-3 border-t border-smoke pt-5">
              <Link href="/schedule" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors">
                <span>View Schedule</span>
                <span className="text-ash">→</span>
              </Link>
              <Link href="/forum" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors border-t border-smoke">
                <span>Browse Forums</span>
                <span className="text-ash">→</span>
              </Link>
              <Link href="/journal/new" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors border-t border-smoke">
                <span>Start a Journal Entry</span>
                <span className="text-ash">→</span>
              </Link>
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(s => s - 1)} className={secondaryBtn}>← Back</button>
              <button
                onClick={async () => {
                  setSaving(true)
                  setError('')
                  try {
                    await complete()
                  } catch {
                    setError('Failed to complete setup.')
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className={primaryBtn}
              >
                {saving ? 'Finishing…' : 'Go to Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
