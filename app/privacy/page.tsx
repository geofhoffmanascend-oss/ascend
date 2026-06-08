import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-steel leading-relaxed">
      <div className="inline-block bg-brand-red px-3 py-1 mb-4">
        <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Legal</span>
      </div>
      <h1 className="font-display text-2xl text-ink mb-2">Privacy Policy</h1>
      <p className="text-xs text-ash mb-6">Last updated: this is a beta placeholder — final policy is being prepared.</p>

      <div className="border border-brand-red/30 bg-brand-red/5 p-3 mb-6 text-xs">
        ⚠️ AscendIt is in active testing. This policy is a temporary placeholder and not legal advice;
        it will be replaced before public launch.
      </div>

      <div className="flex flex-col gap-4">
        <p><span className="font-medium text-ink">What we collect.</span> Account info (name, email), what you choose to add to your profile (belt, bio, gym, photo), and content you create (messages, journal entries, posts, attendance, lesson requests). We log basic usage to operate and improve the Service.</p>
        <p><span className="font-medium text-ink">How we use it.</span> To run the Service — show your profile and activity to the people you&apos;d expect (your gym, people you follow), send notifications, and keep things working. Privacy settings on your profile control who sees which fields.</p>
        <p><span className="font-medium text-ink">Who sees your data.</span> Other users per your privacy settings and gym membership; your gym&apos;s admins/instructors for gym-related features. We don&apos;t sell your personal data.</p>
        <p><span className="font-medium text-ink">Service providers.</span> We use third parties to run the app — hosting (Vercel), database (CockroachDB), email (Resend), image hosting (Cloudinary), and maps/geocoding (Google). They process data only to provide their service.</p>
        <p><span className="font-medium text-ink">Your choices.</span> You can edit or hide profile fields, adjust notification settings, leave a gym, and request deletion of your account by messaging the AscendIt Admin.</p>
        <p><span className="font-medium text-ink">Beta data.</span> During testing, data may be reset or removed. Don&apos;t store anything here you can&apos;t afford to lose.</p>
        <p><span className="font-medium text-ink">Contact.</span> Questions about your data? Message the AscendIt Admin in the app.</p>
      </div>

      <p className="mt-8 text-xs text-ash">See also our <Link href="/terms" className="text-brand-red hover:underline">Terms of Service</Link>.</p>
    </div>
  )
}
