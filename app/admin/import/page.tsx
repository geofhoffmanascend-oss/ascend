import { requireAdmin } from '@/lib/adminAuth'
import Link from 'next/link'
import { BulkImport } from './BulkImport'

export const metadata = { title: 'Import Members' }

export default async function AdminImportPage() {
  await requireAdmin()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-2"><Link href="/admin/users" className="text-xs text-ash hover:text-ink transition-colors">← Members</Link></div>
      <div className="mb-6">
        <div className="inline-block bg-brand-red px-3 py-1 mb-3">
          <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Admin</span>
        </div>
        <h1 className="font-display text-2xl text-ink">Import members from CSV</h1>
        <p className="text-slate text-sm mt-2">
          Upload your existing member list. People with an AscendIt account are added to your gym right away;
          everyone else gets a standing invite that applies automatically when they sign up with that email.
          Rows marked as instructors are flagged for your approval — never granted automatically.
        </p>
      </div>
      <BulkImport />
    </div>
  )
}
