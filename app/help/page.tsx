import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { HelpSection } from './HelpSection'

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
      {/* Page header */}
      <div className="mb-8">
        <span className="inline-block bg-brand-red px-3 py-1 font-display text-xs font-bold tracking-widest uppercase text-paper mb-3">
          Help
        </span>
        <h1 className="font-display text-2xl text-ink">Using Ascend BJJ</h1>
        <p className="mt-2 text-sm text-slate">Click any section to expand it.</p>
      </div>

      {/* Student sections — always shown */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">For Students</p>
        <div className="flex flex-col gap-px">
          <HelpSection title="Getting Started" defaultOpen>
            The onboarding wizard walks you through profile setup. Complete your belt, weight class,
            and bio so instructors and teammates can get to know you. Set your schedule preferences
            to hide classes you don't attend.
          </HelpSection>

          <HelpSection title="Schedule & Registration">
            Browse the weekly schedule. Click any class card to see details and who's registered.
            Click "Register" to commit — you'll appear on the class roster. To unregister, click
            again. Use the Day view for a detailed roster. Use filters to narrow by class type. You
            can navigate weeks forward/backward using the arrows.
          </HelpSection>

          <HelpSection title="Private Lesson Requests">
            Go to Lessons → Request a Lesson. Choose an instructor, preferred date/time, and
            describe your goals. The instructor will confirm or suggest an alternate time. Once
            confirmed, you can message within the lesson thread.
          </HelpSection>

          <HelpSection title="Check-In">
            On the day of a class you've registered for, a Check In button appears on your Dashboard
            and on the class card. Check in within the class window to mark yourself present.
            Alternatively, present your QR code (found on your Profile page) to an instructor for
            gym-side scanning.
          </HelpSection>

          <HelpSection title="Training Journal">
            Log your training after each class. Free-form entries let you write anything. Enable
            guided mode for structured prompts: sleep, energy, technique notes, goals, and more. Set
            your default prompts in Settings. Your journal is private by default — instructors cannot
            see private entries.
          </HelpSection>

          <HelpSection title="Forum">
            Browse all forums from the Forum page. Each class has its own forum. Post questions,
            share videos, or start discussions. Subscribe to a forum to get notified of new posts.
            Reply to any post with the ↩ Reply button.
          </HelpSection>

          <HelpSection title="Direct Messages">
            Click the envelope icon in the header to go to Messages. Search for a user to start a
            conversation. Some users restrict messages from students — if so, your first message
            becomes a request that they can approve or decline.
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
            Edit your profile at any time from the Profile page. Control who sees each field:
            Members (all logged-in users) or Private (only you and admins). Set your Training
            Reflection privacy to share your goals publicly.
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
              to registered students on the day view) or private (instructor/admin only).
            </HelpSection>

            <HelpSection title="Attendance">
              On the session detail page, click each student's name to mark them present or absent.
              Students who check in via the app are automatically marked present. Students who
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
              You can initiate a private lesson from the student's instructor profile page, or
              respond to student requests in Instructor → Lessons. Once confirmed, a private lesson
              thread is created for messaging.
            </HelpSection>

            <HelpSection title="Substitution Requests">
              If you can't cover a session, open it from your schedule and click "Request Sub".
              Other instructors will be notified and can claim the session.
            </HelpSection>

            <HelpSection title="Push Notifications">
              On any session detail page, use the "Notify Students" button to send a push
              notification to all registered students. Use this for last-minute changes, reminders,
              or announcements.
            </HelpSection>

            <HelpSection title="Feedback">
              Post-class feedback from students appears in Instructor → Feedback. Feedback is
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
              On a user's admin detail page, use the Role Manager to toggle roles. The student role
              is always present. Adding the instructor role will trigger instructor onboarding for
              that user on their next login.
            </HelpSection>

            <HelpSection title="Class Group Access">
              Control which class types a user can register for from their admin detail page.
              Blocked class groups are grayed out on the student's schedule — they cannot register
              or check in.
            </HelpSection>

            <HelpSection title="Class Management">
              Create and edit classes at Admin → Classes. Set the day, time, instructor, type, and
              location. Classes generate sessions automatically for the schedule.
            </HelpSection>

            <HelpSection title="Attendance Reports">
              Admin → Attendance provides filterable reports: by student, by class, by date range.
              Export-friendly table view.
            </HelpSection>

            <HelpSection title="Forum Moderation">
              Admin → Forum lists all forums. You can delete any post or reply across all forums.
              Pin important posts as an instructor.
            </HelpSection>

            <HelpSection title="Store Management">
              Admin → Store lets you add, edit, and hide products. Manage incoming orders and mark
              them ready for pickup or picked up.
            </HelpSection>

            <HelpSection title="Settings">
              Admin → Settings contains gym-wide configuration: the public review URL (used in
              positive feedback prompts) and other global settings.
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
