// Recreate a test student for manual onboarding testing.
// Idempotent: re-running resets the account to a fresh, un-onboarded state.
import prisma from '../lib/database'
import bcrypt from 'bcryptjs'

const EMAIL = 'student1@gym.com'
const PASSWORD = 'student1234'
const NAME = 'Test Student'

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12)
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, name: NAME, passwordHash, roles: ['student'] },
    update: {
      name: NAME,
      passwordHash,
      roles: ['student'],
      onboardingDone: false,
      onboardedRoles: [],
      gymId: null,
    },
    select: { id: true, email: true, onboardingDone: true, gymId: true },
  })
  console.log('OK ' + JSON.stringify(user))
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
