import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-steel leading-relaxed">
      <div className="inline-block bg-brand-red px-3 py-1 mb-4">
        <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Legal</span>
      </div>
      <h1 className="font-display text-2xl text-ink mb-2">Terms of Service</h1>
      <p className="text-xs text-ash mb-6">Last updated: this is a beta placeholder — final terms are being prepared.</p>

      <div className="border border-brand-red/30 bg-brand-red/5 p-3 mb-6 text-xs">
        ⚠️ AscendIt is in active testing. These terms are a temporary placeholder and not legal advice;
        they will be replaced before public launch.
      </div>

      <div className="flex flex-col gap-4">
        <p><span className="font-medium text-ink">1. Acceptance.</span> By creating an account or using AscendIt (the &ldquo;Service&rdquo;), you agree to these Terms. If you don&apos;t agree, don&apos;t use the Service.</p>
        <p><span className="font-medium text-ink">2. Beta.</span> The Service is provided as-is during testing. Features may change, break, or be removed, and data may be reset. Don&apos;t rely on it as your only record.</p>
        <p><span className="font-medium text-ink">3. Your account.</span> You&apos;re responsible for activity under your account and for keeping your login secure. You must be old enough to consent in your jurisdiction (or have a parent/guardian do so).</p>
        <p><span className="font-medium text-ink">4. Your content.</span> You keep ownership of what you post (messages, journal entries, photos, etc.). You grant AscendIt a license to host and display it to operate the Service. Don&apos;t post anything unlawful, abusive, or that infringes others&apos; rights.</p>
        <p><span className="font-medium text-ink">5. Gyms &amp; instruction.</span> AscendIt is a software platform; it does not provide jiu-jitsu instruction, supervise training, or guarantee any gym, instructor, or event. Training is physical activity with inherent risk — you participate at your own risk and any waivers are between you and your gym.</p>
        <p><span className="font-medium text-ink">6. No warranty / liability.</span> To the extent permitted by law, the Service is provided without warranties, and AscendIt is not liable for indirect or consequential damages.</p>
        <p><span className="font-medium text-ink">7. Changes.</span> We may update these Terms; continued use means you accept the changes.</p>
        <p><span className="font-medium text-ink">8. Contact.</span> Questions? Message the AscendIt Admin in the app.</p>
      </div>

      <p className="mt-8 text-xs text-ash">See also our <Link href="/privacy" className="text-brand-red hover:underline">Privacy Policy</Link>.</p>
    </div>
  )
}
