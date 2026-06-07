'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GymPicker } from '@/app/components/GymPicker'
import { GymForumPrompt } from '@/app/components/GymForumPrompt'

const BELTS = ['white', 'blue', 'purple', 'brown', 'black'] as const
type Belt = typeof BELTS[number]

type OnboardForum = { id: string; title: string; type: string; posts: number; subscribers: number; subscribed: boolean }
type ClassGroup = { id: string; name: string; description: string | null }
type OnboardInfo = { hasAdmin: boolean; forums: OnboardForum[]; classGroups: ClassGroup[] }

interface Props {
  userId: string
  userName: string
  userBelt: Belt
  userStripes: number
  redirectAfter: string
  initialGymId?: string | null
  initialGymName?: string | null
}

const TOTAL_STEPS = 5

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i + 1 === current ? 'bg-brand-red' : i + 1 < current ? 'bg-steel' : 'bg-smoke'
          }`}
        />
      ))}
    </div>
  )
}

export function OnboardingWizard({ userId, userName, userBelt, userStripes, redirectAfter, initialGymId, initialGymName }: Props) {
  const router = useRouter()

  const returningFromRegister = Boolean(initialGymId && initialGymName)

  const [step, setStep] = useState(returningFromRegister ? 2 : 1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [name, setName] = useState(userName || '')
  const [belt, setBelt] = useState<Belt>(userBelt || 'white')
  const [stripes, setStripes] = useState(userStripes || 0)

  // Step 2 — gym + forum
  const [selectedGym, setSelectedGym] = useState<{ id: string; name: string } | null>(
    returningFromRegister ? { id: initialGymId!, name: initialGymName! } : null
  )
  const [showGymForumPrompt, setShowGymForumPrompt] = useState(returningFromRegister)
  const [justCreatedGym, setJustCreatedGym] = useState(returningFromRegister)
  const [info, setInfo] = useState<OnboardInfo | null>(null)
  const [subWorking, setSubWorking] = useState<string | null>(null)

  // Step 3 — gym class-group schedule visibility (checked = shown)
  const [checkedPrograms, setCheckedPrograms] = useState<Set<string>>(new Set())

  // Step 4 — reflection
  const [whyStarted, setWhyStarted] = useState('')
  const [challenges, setChallenges] = useState('')
  const [goals, setGoals] = useState('')

  const hasScheduleStep = (info?.classGroups.length ?? 0) > 0

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Save failed')
  }

  async function loadGymInfo(gymId: string) {
    const res = await fetch(`/api/gyms/${gymId}/onboarding`)
    const data: OnboardInfo = await res.json()
    setInfo(data)
    setCheckedPrograms(new Set(data.classGroups.map(g => g.id)))
    return data
  }

  async function saveStep1() {
    await patch({ name: name || undefined, belt, stripes })
  }

  async function toggleSubscribe(f: OnboardForum) {
    setSubWorking(f.id)
    const method = f.subscribed ? 'DELETE' : 'POST'
    await fetch(`/api/forums/${f.id}/subscribe`, { method })
    setInfo(prev => prev ? { ...prev, forums: prev.forums.map(x => x.id === f.id ? { ...x, subscribed: !x.subscribed } : x) } : prev)
    setSubWorking(null)
  }

  function toggleProgram(id: string) {
    setCheckedPrograms(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function saveStep3() {
    if (!info) return
    const hiddenProgramIds = info.classGroups.map(g => g.id).filter(id => !checkedPrograms.has(id))
    await patch({ hiddenProgramIds })
  }

  async function saveStep4() {
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

  // Leaving the step-2 forum sub-step → schedule prefs (if the gym has groups) else reflection.
  function afterGym() {
    setShowGymForumPrompt(false)
    setStep(hasScheduleStep ? 3 : 4)
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
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Belt</label>
                <select value={belt} onChange={e => setBelt(e.target.value as Belt)} className={inputCls}>
                  {BELTS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Stripes</label>
                <select value={stripes} onChange={e => setStripes(Number(e.target.value))} className={inputCls}>
                  {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <p className="text-xs text-ash border border-smoke bg-mist px-3 py-2">
              Your belt is self-reported. Once you join a gym, a gym admin can verify it — verified belts show a checkmark on your profile and forum posts.
            </p>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-end">
              <button onClick={async () => { setSaving(true); setError(''); try { await saveStep1(); setStep(2) } catch { setError('Failed to save. Please try again.') } finally { setSaving(false) } }} disabled={saving} className={primaryBtn}>
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
              onCreateNew={gymName => { router.push(`/gyms/register?returnTo=onboarding&name=${encodeURIComponent(gymName)}`) }}
            />

            {selectedGym && (
              <div className="flex items-center gap-2 px-4 py-3 bg-mist border border-smoke text-sm text-ink">
                <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>{selectedGym.name}</span>
              </div>
            )}

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className={secondaryBtn}>← Back</button>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedGym(null); setInfo(null); setStep(4) }} className={secondaryBtn}>I train independently</button>
                <button
                  onClick={async () => {
                    if (!selectedGym) { setStep(4); return }
                    setSaving(true); setError('')
                    try {
                      await fetch(`/api/gyms/${selectedGym.id}/membership`, { method: 'PUT' })
                      await loadGymInfo(selectedGym.id)
                      setShowGymForumPrompt(true)
                    } catch { setError('Failed to save. Please try again.') }
                    finally { setSaving(false) }
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

        {/* ── Step 2 sub-step: Gym Forums ── */}
        {step === 2 && showGymForumPrompt && selectedGym && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 2 · Gym Forums</p>
              <h2 className="font-display text-xl text-ink mb-1">Connect with your training partners</h2>
            </div>
            {justCreatedGym && (
              <div className="flex items-center gap-2 px-4 py-3 bg-mist border border-smoke text-sm text-ink">
                <svg className="w-4 h-4 text-brand-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>You created <strong>{selectedGym.name}</strong> — you're now a member.</span>
              </div>
            )}

            {/* Managed gym (has an admin): subscribe to existing forums (no create option). */}
            {info?.hasAdmin ? (
              info.forums.length > 0 ? (
                <div className="border border-smoke bg-paper p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">{selectedGym.name} Forums</p>
                  <p className="text-xs text-ash mb-4">Subscribe to the ones you want in your Forums list. You can change these anytime in Settings.</p>
                  <div className="flex flex-col gap-3">
                    {info.forums.map(f => (
                      <label key={f.id} className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={f.subscribed} disabled={subWorking === f.id} onChange={() => toggleSubscribe(f)} className="mt-0.5 w-4 h-4 accent-brand-red" />
                        <div>
                          <div className="text-sm font-medium text-ink">{f.title}</div>
                          <div className="text-xs text-ash">{f.posts} post{f.posts !== 1 ? 's' : ''} · {f.subscribers} subscribed</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ash border border-smoke bg-mist px-4 py-3">Your gym hasn't created any forums yet. They'll show up here once it does.</p>
              )
            ) : (
              /* Community gym (no admin yet): the original create/join-one-forum prompt. */
              <GymForumPrompt gymId={selectedGym.id} gymName={selectedGym.name} onDone={afterGym} />
            )}

            <div className="flex justify-between">
              <button onClick={() => { setShowGymForumPrompt(false); setJustCreatedGym(false) }} className={secondaryBtn}>← Back</button>
              {info?.hasAdmin && <button onClick={afterGym} className={primaryBtn}>Next →</button>}
            </div>
          </div>
        )}

        {/* ── Step 3: Class-group schedule preferences (gym-defined) ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 3 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">Which classes do you normally attend?</h2>
              <p className="text-sm text-slate">Unchecked groups from {selectedGym?.name ?? 'your gym'} are hidden from your schedule. You can change this in Settings.</p>
            </div>

            <div className="flex flex-col gap-3">
              {info?.classGroups.map(g => (
                <label key={g.id} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={checkedPrograms.has(g.id)} onChange={() => toggleProgram(g.id)} className="mt-0.5 w-4 h-4 accent-brand-red" />
                  <div>
                    <div className="text-sm font-medium text-ink">{g.name}</div>
                    {g.description && <div className="text-xs text-slate">{g.description}</div>}
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => { setStep(2); setShowGymForumPrompt(true) }} className={secondaryBtn}>← Back</button>
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className={secondaryBtn}>Skip for now</button>
                <button onClick={async () => { setSaving(true); setError(''); try { await saveStep3(); setStep(4) } catch { setError('Failed to save. Please try again.') } finally { setSaving(false) } }} disabled={saving} className={primaryBtn}>
                  {saving ? 'Saving…' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Training Reflection ── */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 4 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-xl text-ink mb-1">A few questions to help you get the most from your training</h2>
              <p className="text-sm text-slate">Your answers are private by default — only you can see them. You can share them later from your profile.</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Why did you start training Jiu-Jitsu?</label>
              <textarea value={whyStarted} onChange={e => setWhyStarted(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="What brought you to the mat?" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>What challenges or obstacles have you faced — and how can you overcome them?</label>
              <textarea value={challenges} onChange={e => setChallenges(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Injuries, consistency, nerves, schedule..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>What are your goals? What are you hoping to learn or achieve?</label>
              <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} className={`${inputCls} resize-none`} placeholder="Compete, get fit, self-defense, earn my blue belt..." />
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => { if (hasScheduleStep) setStep(3); else { setStep(2); setShowGymForumPrompt(Boolean(selectedGym)) } }} className={secondaryBtn}>← Back</button>
              <div className="flex gap-3">
                <button onClick={() => setStep(5)} className={secondaryBtn}>Skip for now</button>
                <button onClick={async () => { setSaving(true); setError(''); try { await saveStep4(); setStep(5) } catch { setError('Failed to save. Please try again.') } finally { setSaving(false) } }} disabled={saving} className={primaryBtn}>
                  {saving ? 'Saving…' : 'Save Reflection →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Completion ── */}
        {step === 5 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-1">Step 5 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-2xl text-ink mb-2">You're all set!</h2>
              <p className="text-sm text-slate">Welcome to AscendIt.</p>
            </div>

            <div className="border border-smoke bg-mist p-4 flex items-center gap-3">
              <span className="text-2xl animate-bounce leading-none" aria-hidden>☰</span>
              <p className="text-sm text-steel">
                Find everything — schedule, forums, messages &amp; journal — in the{' '}
                <span className="font-bold text-ink">menu</span> at the top
                <span className="hidden sm:inline"> right</span> of every page.
              </p>
            </div>

            {selectedGym ? (
              <Link href="/schedule" className="block border border-smoke border-l-2 border-l-brand-red bg-paper p-4 hover:border-steel transition-colors">
                <p className="text-sm font-bold text-ink">Register for class →</p>
                <p className="text-xs text-ash mt-0.5">See {selectedGym.name}&apos;s schedule and reserve your spot.</p>
              </Link>
            ) : (
              <Link href="/events" className="block border border-smoke border-l-2 border-l-brand-red bg-paper p-4 hover:border-steel transition-colors">
                <p className="text-sm font-bold text-ink">Find local open mats, tournaments &amp; seminars →</p>
                <p className="text-xs text-ash mt-0.5">You're training independently — see what's happening near you.</p>
              </Link>
            )}

            <div className="flex flex-col gap-3 border-t border-smoke pt-5">
              <Link href="/forum" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors">
                <span>Browse Forums</span><span className="text-ash">→</span>
              </Link>
              <Link href="/journal/new" className="flex items-center justify-between py-2 text-sm text-ink hover:text-brand-red transition-colors border-t border-smoke">
                <span>Start a Journal Entry</span><span className="text-ash">→</span>
              </Link>
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}

            <div className="flex justify-between">
              <button onClick={() => setStep(4)} className={secondaryBtn}>← Back</button>
              <button onClick={async () => { setSaving(true); setError(''); try { await complete() } catch { setError('Failed to complete setup.'); setSaving(false) } }} disabled={saving} className={primaryBtn}>
                {saving ? 'Finishing…' : 'Go to Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
