'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

// Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, commas, CRLF).
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

type Field = 'ignore' | 'email' | 'name' | 'belt' | 'phone' | 'instructor' | 'notes'
const FIELD_OPTIONS: { value: Field; label: string }[] = [
  { value: 'ignore', label: 'Ignore' },
  { value: 'email', label: 'Email *' },
  { value: 'name', label: 'Name' },
  { value: 'belt', label: 'Belt' },
  { value: 'phone', label: 'Phone' },
  { value: 'instructor', label: 'Instructor? (yes/no)' },
  { value: 'notes', label: 'Notes' },
]

function guessField(header: string): Field {
  const h = header.toLowerCase()
  if (h.includes('email') || h.includes('e-mail')) return 'email'
  if (h.includes('instructor') || h.includes('coach')) return 'instructor'
  if (h.includes('belt') || h.includes('rank')) return 'belt'
  if (h.includes('phone') || h.includes('mobile') || h.includes('cell')) return 'phone'
  if (h.includes('name')) return 'name'
  if (h.includes('note')) return 'notes'
  return 'ignore'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const truthy = (v: string) => /^(y|yes|true|1|instructor|coach|x)$/i.test(v.trim())

type ImportRow = { email: string; name?: string; belt?: string; phone?: string; instructor: boolean; notes?: string }
type Summary = { invited: number; associated: number; alreadyMember: number; alreadyInvited: number; invalid: number; instructorRequests: number }

export function BulkImport() {
  const [headers, setHeaders] = useState<string[]>([])
  const [dataRows, setDataRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Field[]>([])
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setSummary(null); setError('')
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result ?? ''))
      if (parsed.length < 2) { setError('That file has no data rows.'); setHeaders([]); setDataRows([]); return }
      const hs = parsed[0].map(h => h.trim())
      setHeaders(hs)
      setDataRows(parsed.slice(1))
      setMapping(hs.map(guessField))
    }
    reader.readAsText(file)
  }

  const emailCol = mapping.indexOf('email')

  const rows: ImportRow[] = useMemo(() => {
    if (emailCol < 0) return []
    const get = (cells: string[], field: Field) => {
      const idx = mapping.indexOf(field)
      return idx >= 0 ? (cells[idx] ?? '').trim() : ''
    }
    return dataRows.map(cells => ({
      email: (cells[emailCol] ?? '').trim().toLowerCase(),
      name: get(cells, 'name') || undefined,
      belt: get(cells, 'belt') || undefined,
      phone: get(cells, 'phone') || undefined,
      instructor: truthy(get(cells, 'instructor')),
      notes: get(cells, 'notes') || undefined,
    }))
  }, [dataRows, mapping, emailCol])

  const validRows = rows.filter(r => EMAIL_RE.test(r.email))
  const invalidCount = rows.length - validRows.length

  async function submit() {
    setSubmitting(true); setError('')
    const res = await fetch('/api/admin/invites/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: validRows }),
    })
    setSubmitting(false)
    if (res.ok) { setSummary((await res.json()).summary) }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Import failed.') }
  }

  function reset() {
    setHeaders([]); setDataRows([]); setMapping([]); setFileName(''); setSummary(null); setError('')
  }

  if (summary) {
    return (
      <div className="border border-smoke bg-paper p-6 flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">Import complete.</p>
        <ul className="text-sm text-slate flex flex-col gap-1">
          <li>✓ {summary.invited} invited (will join when they sign up)</li>
          <li>✓ {summary.associated} existing members added to your gym</li>
          {summary.instructorRequests > 0 && <li>⚑ {summary.instructorRequests} flagged as instructors — approve them in your roster</li>}
          {summary.alreadyMember > 0 && <li className="text-ash">{summary.alreadyMember} already in your gym (skipped)</li>}
          {summary.alreadyInvited > 0 && <li className="text-ash">{summary.alreadyInvited} already invited (skipped)</li>}
          {summary.invalid > 0 && <li className="text-ash">{summary.invalid} skipped (invalid email)</li>}
        </ul>
        <div className="flex gap-2 mt-2">
          <button onClick={reset} className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors">Import another</button>
          <Link href="/admin/users" className="px-4 py-2 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors">Back to members</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="border border-smoke bg-paper p-5">
        <label className="text-xs font-bold uppercase tracking-widest text-steel">Upload a CSV</label>
        <p className="text-xs text-ash mt-1 mb-3">Any CSV with a header row works — you map the columns next. Only email is required.</p>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm text-steel file:mr-3 file:px-4 file:py-2 file:border file:border-smoke file:bg-mist file:text-ink file:text-sm file:font-medium hover:file:border-steel" />
        {fileName && <p className="text-xs text-ash mt-2">{fileName} · {dataRows.length} row{dataRows.length === 1 ? '' : 's'}</p>}
      </div>

      {headers.length > 0 && (
        <>
          <div className="border border-smoke bg-paper p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Map your columns</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-ink truncate flex-1" title={h}>{h || `Column ${i + 1}`}</span>
                  <span className="text-ash">→</span>
                  <select
                    value={mapping[i]}
                    onChange={e => setMapping(m => m.map((x, j) => (j === i ? (e.target.value as Field) : x)))}
                    className="px-2 py-1.5 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red"
                  >
                    {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {emailCol < 0 && <p className="text-sm text-brand-red mt-3">Map one column to <strong>Email</strong> to continue.</p>}
          </div>

          {emailCol >= 0 && (
            <div className="border border-smoke bg-paper p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">
                Preview — {validRows.length} to import{invalidCount > 0 && `, ${invalidCount} skipped (bad email)`}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ash border-b border-smoke">
                      <th className="py-1.5 pr-3">Email</th><th className="py-1.5 pr-3">Name</th>
                      <th className="py-1.5 pr-3">Belt</th><th className="py-1.5 pr-3">Phone</th><th className="py-1.5">Instructor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 12).map((r, i) => {
                      const ok = EMAIL_RE.test(r.email)
                      return (
                        <tr key={i} className={`border-b border-smoke/60 ${ok ? '' : 'opacity-40'}`}>
                          <td className="py-1.5 pr-3 text-ink">{r.email || <span className="text-brand-red">—</span>}{!ok && r.email && ' ⚠'}</td>
                          <td className="py-1.5 pr-3 text-steel">{r.name ?? ''}</td>
                          <td className="py-1.5 pr-3 text-steel">{r.belt ?? ''}</td>
                          <td className="py-1.5 pr-3 text-steel">{r.phone ?? ''}</td>
                          <td className="py-1.5 text-steel">{r.instructor ? 'Yes' : ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {rows.length > 12 && <p className="text-xs text-ash mt-2">…and {rows.length - 12} more</p>}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <div className="flex gap-2">
            <button onClick={reset} className="px-5 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors">Cancel</button>
            <button onClick={submit} disabled={submitting || validRows.length === 0} className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60">
              {submitting ? 'Importing…' : `Import ${validRows.length} member${validRows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
