'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { roleLabel } from '@/lib/roles'

const BELTS = ['white', 'blue', 'purple', 'brown', 'black']
const ROLES = ['instructor', 'admin', 'vendor', 'site_admin'] as const

type Gym = { id: string; name: string }
type Initial = {
  id: string
  name: string | null
  email: string
  phone: string | null
  belt: string | null
  stripes: number
  beltVerified: boolean
  gymId: string | null
  roles: string[]
}

export function SiteUserEditClient({ initial, gyms }: { initial: Initial; gyms: Gym[] }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: initial.name ?? '',
    email: initial.email,
    phone: initial.phone ?? '',
    belt: initial.belt ?? 'white',
    stripes: initial.stripes ?? 0,
    beltVerified: initial.beltVerified,
    gymId: initial.gymId ?? '',
    roles: new Set(initial.roles),
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const toggleRole = (r: string) =>
    setForm(f => {
      const roles = new Set(f.roles)
      roles.has(r) ? roles.delete(r) : roles.add(r)
      return { ...f, roles }
    })

  async function save() {
    setSaving(true); setMsg(null)
    const res = await fetch(`/api/site-admin/users/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        belt: form.belt,
        stripes: Number(form.stripes),
        beltVerified: form.beltVerified,
        gymId: form.gymId || null,
        roles: ['student', ...form.roles],
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setMsg({ text: 'Saved ✓', ok: true }); router.refresh() }
    else setMsg({ text: data.error ?? 'Save failed', ok: false })
    setSaving(false)
  }

  const label = 'text-xs font-bold uppercase tracking-widest text-steel'
  const input = 'w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors'

  return (
    <div className="border border-smoke bg-paper p-5 flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-widest text-steel">Edit User</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1"><label className={label}>Name</label><input className={input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="flex flex-col gap-1"><label className={label}>Email</label><input className={input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
        <div className="flex flex-col gap-1"><label className={label}>Phone</label><input className={input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div className="flex flex-col gap-1"><label className={label}>Gym</label>
          <select className={input} value={form.gymId} onChange={e => setForm(f => ({ ...f, gymId: e.target.value }))}>
            <option value="">— No gym —</option>
            {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1"><label className={label}>Belt</label>
          <select className={input} value={form.belt} onChange={e => setForm(f => ({ ...f, belt: e.target.value }))}>
            {BELTS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1"><label className={label}>Stripes</label>
          <select className={input} value={form.stripes} onChange={e => setForm(f => ({ ...f, stripes: Number(e.target.value) }))}>
            {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-steel">
        <input type="checkbox" checked={form.beltVerified} onChange={e => setForm(f => ({ ...f, beltVerified: e.target.checked }))} />
        Belt verified
      </label>

      <div className="flex flex-col gap-1">
        <label className={label}>Roles <span className="text-ash normal-case font-normal">(member always on)</span></label>
        <div className="flex flex-wrap gap-3">
          {ROLES.map(r => (
            <label key={r} className="flex items-center gap-1.5 text-sm text-steel border border-smoke px-2 py-1">
              <input type="checkbox" checked={form.roles.has(r)} onChange={() => toggleRole(r)} />
              {roleLabel(r)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="px-5 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? 'text-green-600' : 'text-brand-red'}`}>{msg.text}</span>}
      </div>
    </div>
  )
}
