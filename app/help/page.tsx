import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { HelpSection } from './HelpSection'
import { BetaNotice } from '@/app/components/BetaNotice'

export const metadata = { title: 'Help' }

export default async function HelpPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const roles = session.user.roles ?? []
  const isInstructor = roles.includes('instructor') || roles.includes('admin')
  const isAdmin = roles.includes('admin')
  const isVendor = roles.includes('vendor')

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <BetaNotice variant="help" />
      {/* Page header */}
      <div className="mb-8">
        <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-3">
          Help
        </span>
        <h1 className="font-display text-2xl text-ink">Using AscendIt</h1>
        <p className="mt-2 text-sm text-slate">Click any section to expand it.</p>
      </div>

      {/* Student sections — always shown */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">For Members</p>
        <div className="flex flex-col gap-px">
          <HelpSection title="Getting Started" defaultOpen>
            The onboarding wizard walks you through profile setup: your belt, a photo, and a short
            bio so instructors and teammates can get to know you. You'll also pick your gym and choose
            which of its class groups to show on your schedule (you can change this anytime in Settings).
          </HelpSection>

          <HelpSection title="Schedule & Registration">
            Browse the weekly schedule. Click any class card to see details and who's registered.
            Click "Register" to commit — you'll appear on the class roster. To unregister, click
            again. Use the Day view for a detailed roster. Use filters to narrow by class type. You
            can navigate weeks forward/backward using the arrows.
          </HelpSection>

          <HelpSection title="Private Lesson Requests">
            Go to Lessons. Pick an instructor at your gym (or use "Search beyond my gym" to find
            instructors elsewhere), then choose an available time from their calendar — you can select
            several at once. The instructor confirms each request, and you can message within the
            lesson thread once confirmed.
          </HelpSection>

          <HelpSection title="Check-In">
            On the day of a class you've registered for, a Check In button appears on your Dashboard
            and on the class card. Check in within the class window to mark yourself present. If your
            gym uses QR check-in, you can also present the QR code from your Profile page for gym-side
            scanning.
          </HelpSection>

          <HelpSection title="Training Journal">
            Log your training after each class. Free-form entries let you write anything. Enable
            guided mode for structured prompts: sleep, energy, technique notes, goals, and more. Set
            your default prompts in Settings. Your journal is private by default — instructors cannot
            see private entries.
          </HelpSection>

          <HelpSection title="Forum">
            From the Forum page you'll see your gym's forums (a general forum plus a forum for each
            class group and class) and public community forums open to everyone. Post questions, share
            videos, or start discussions; subscribe to get notified of new posts and reply with the
            ↩ Reply button.
          </HelpSection>

          <HelpSection title="Direct Messages">
            Click the envelope icon in the header to go to Messages. Search for a member of your gym
            to start a conversation. Some members restrict messages — if so, your first message
            becomes a request they can approve or decline.
          </HelpSection>

          <HelpSection title="Gallery">
            Browse and upload photos and videos. Tag teammates in uploads. Use hashtags to organize
            content by event or topic. Toggle between grid, masonry, and timeline layouts.
          </HelpSection>

          <HelpSection title="Store">
            Browse available gear and apparel. Add items to your cart and place an order (pay at
            pickup). You'll be notified when your order is ready.
          </HelpSection>

          <HelpSection title="Profile & Privacy">
            Edit your profile any time from the Profile page — including a profile photo (upload one
            or paste an image URL). Control who sees each field: Public (anyone), Members (logged-in
            users), or Private (only you and admins). Your gym is shown as a link to its page.
          </HelpSection>

          <HelpSection title="Invite Friends">
            Share AscendIt with training partners from the Invite Friends tile on your Dashboard.
            Your invite link (and QR code) are personal — anyone who joins through them automatically
            follows you, and you follow them.
          </HelpSection>

          <HelpSection title="Notifications">
            Manage notification preferences in Settings. You can opt out of class updates,
            instructor notes, check-in prompts, feedback requests, or private message alerts. Enable
            email copies to receive notifications by email.
          </HelpSection>
        </div>
      </div>

      {/* Instructor sections */}
      {isInstructor && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">For Instructors</p>
          <div className="flex flex-col gap-px">
            <HelpSection title="Session Management">
              Your upcoming sessions appear on the Instructor home page. Click any session to view
              the roster, mark attendance, and add session notes. Notes can be marked public (visible
              to registered members on the day view) or private (instructor/admin only).
            </HelpSection>

            <HelpSection title="Attendance">
              On the session detail page, click each student's name to mark them present or absent.
              Members who check in via the app are automatically marked present. Members who
              haven't registered but show up can be added manually.
            </HelpSection>

            <HelpSection title="Student Notes">
              Click any student's name to open their profile and add private notes. Notes are not
              visible to the student. Use this to track injuries, progress, and coaching priorities.
            </HelpSection>

            <HelpSection title="Lesson Plans">
              Create reusable lesson plans under Instructor → Lesson Plans. Plans can be tagged by
              class type and technique focus. Reference them when planning sessions.
            </HelpSection>

            <HelpSection title="Private Lessons">
              Set your availability at Instructor → Lesson Availability — add recurring weekly windows,
              one-off times, and blocks. Members can then request open times from your calendar; you
              confirm requests in Instructor → Lessons, and a private lesson thread is created for
              messaging. You can also toggle whether you accept requests from members at other gyms.
            </HelpSection>

            <HelpSection title="Substitution Requests">
              If you can't cover a session, open it from your schedule and click "Request Sub".
              Other instructors will be notified and can claim the session.
            </HelpSection>

            <HelpSection title="Push Notifications">
              On any session detail page, use the "Notify Class" button to send a push
              notification to all registered members. Use this for last-minute changes, reminders,
              or announcements.
            </HelpSection>

            <HelpSection title="Feedback">
              Post-class feedback from members appears in Instructor → Feedback. Feedback is
              categorized as positive, neutral, negative, or a flagged concern. Anonymous feedback
              is marked as such.
            </HelpSection>
          </div>
        </div>
      )}

      {/* Admin sections */}
      {isAdmin && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">For Admins</p>
          <div className="flex flex-col gap-px">
            <HelpSection title="User Management">
              Browse and search all users at Admin → Users. Click any user to view their full
              profile, attendance history, belt rank, and goals. Assign roles (instructor, vendor)
              from the user detail page.
            </HelpSection>

            <HelpSection title="Role Assignment">
              On a member's admin detail page, use the Role Manager to toggle roles. The Member role
              is always present. You can also <strong>invite instructors</strong> from Admin → Users —
              either a single-use link that grants the instructor role on sign-up, or an "approve
              after sign-up" link where you approve the request from the same page.
            </HelpSection>

            <HelpSection title="Class Group Access">
              Control which of your gym's class groups a member can register for from their admin
              detail page. Blocked groups are grayed out on their schedule — they cannot register or
              check in. (For your demo/legacy gym this still uses the fixed class types.)
            </HelpSection>

            <HelpSection title="Class Management & Class Groups">
              Add classes at Admin → Classes. Use <strong>Add Classes</strong> to create a class on
              several days at once (check the days) and assign it to a class group. Manage groups under
              Class Groups — group classes by time or skill level (e.g. 6am, Noon, Advanced No-Gi), and
              each group can have its own forum. Classes generate schedule sessions automatically.
            </HelpSection>

            <HelpSection title="Attendance Reports">
              Admin → Attendance provides filterable reports — by member, by class, by instructor, and
              by date range, scoped to your gym.
            </HelpSection>

            <HelpSection title="Forum Moderation">
              Admin → Forum lists your gym's forums. You can delete posts and replies, and delete a
              whole forum if needed (deleting a class group does not delete its forum). Pin important
              posts as an instructor.
            </HelpSection>

            <HelpSection title="Store Management">
              Admin → Store lets you add, edit, and hide products. Manage incoming orders and mark
              them ready for pickup or picked up.
            </HelpSection>

            <HelpSection title="Settings">
              Admin → Settings holds your gym's configuration: your gym logo, the public review URL
              (used in positive-feedback prompts), and per-gym feature toggles.
            </HelpSection>
          </div>
        </div>
      )}

      {/* Vendor sections */}
      {isVendor && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">For Vendors</p>
          <div className="flex flex-col gap-px">
            <HelpSection title="Vendor Dashboard">
              The Vendor portal is your hub for managing your presence in the gym store and gallery.
              Upload product images, manage listings, and track orders associated with your vendor
              account. Contact the gym admin to update your vendor type or permissions.
            </HelpSection>
          </div>
        </div>
      )}
    </main>
  )
}
