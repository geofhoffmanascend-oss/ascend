// Phase 37 verification harness. Exercises the REAL getEffectiveFeatures logic
// against the DB for student/admin/platform scenarios, then restores all state.
//   npx tsx scripts/verify-gym-features.ts

import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
dotenvLocal.config({ path: '.env.local', override: true })

import prisma from '../lib/database'
import { getEffectiveFeatures } from '../lib/features'
import { upsertGymFeatures } from '../lib/gymFeatures'
import { upsertPlatformSettings, getPlatformSettings } from '../lib/platformSettings'

let pass = 0, fail = 0
function check(label: string, cond: boolean) {
  console.log(`${cond ? '✅' : '❌'} ${label}`)
  cond ? pass++ : fail++
}

// Build a minimal session shape accepted by getEffectiveFeatures.
function sess(roles: string[], gymId: string | null) {
  return { user: { id: 'x', roles, gymId } } as any
}

async function main() {
  const gym = await prisma.gym.findUnique({ where: { slug: 'ascend' } })
  if (!gym) throw new Error('Ascend gym not found — run setup-ascend-gym.ts first')

  // Snapshot platform settings to restore later.
  const platformBefore = await getPlatformSettings()
  console.log('Live platform baseline (restored at end):', JSON.stringify(platformBefore))

  try {
    // Isolate gym-flag behavior: set all platform flags ON for the gym scenarios.
    await upsertPlatformSettings({
      allowGymForumCreation: true, allowBeltForumPosting: true, allowEventSubmission: true,
      allowTournamentRegistration: true, scheduleReadOnly: false,
      galleryUploadEnabled: true, storeEnabled: true,
    })

    // --- Scenario 1: gym turns Store + Tournaments off ---
    await upsertGymFeatures(gym.id, { storeEnabled: false, tournamentsEnabled: false })
    const student = await getEffectiveFeatures(sess(['student'], gym.id))
    check('student: store hidden when gym storeEnabled=false', student.store === false)
    check('student: tournaments hidden when gym tournamentsEnabled=false', student.tournaments === false)
    check('student: gallery still on (gym flag true)', student.gallery === true)
    check('student: journal still on (gym flag true)', student.journal === true)

    // --- Scenario 2: gym admin bypasses their own gym toggles ---
    const admin = await getEffectiveFeatures(sess(['student', 'admin'], gym.id))
    check('admin: store visible despite gym off (bypass)', admin.store === true)
    check('admin: tournaments visible despite gym off (bypass)', admin.tournaments === true)

    // --- Scenario 3: site_admin bypass ---
    const siteAdmin = await getEffectiveFeatures(sess(['student', 'site_admin'], gym.id))
    check('site_admin: store visible (bypass)', siteAdmin.store === true)

    // --- Scenario 4: platform flag overrides even when gym flag is on ---
    await upsertGymFeatures(gym.id, { storeEnabled: true, tournamentsEnabled: true })
    await upsertPlatformSettings({ storeEnabled: false })
    const student2 = await getEffectiveFeatures(sess(['student'], gym.id))
    check('student: store hidden when PLATFORM storeEnabled=false (gym on)', student2.store === false)
    const admin2 = await getEffectiveFeatures(sess(['student', 'admin'], gym.id))
    check('admin: store visible despite platform off (bypass)', admin2.store === true)

    // --- Scenario 5: user with no gym → gym defaults all on (platform still applies) ---
    await upsertPlatformSettings({ storeEnabled: true })
    const nogym = await getEffectiveFeatures(sess(['student'], null))
    check('no-gym student: all features default on', nogym.store && nogym.tournaments && nogym.gallery && nogym.privateLessons && nogym.gymForum && nogym.journal)
  } finally {
    // Restore: reset Ascend feature flags to all-on, restore platform settings.
    await upsertGymFeatures(gym.id, {
      storeEnabled: true, tournamentsEnabled: true, galleryEnabled: true,
      privateLessonsEnabled: true, gymForumEnabled: true, journalEnabled: true,
    })
    await upsertPlatformSettings({
      allowGymForumCreation: platformBefore.allowGymForumCreation,
      allowBeltForumPosting: platformBefore.allowBeltForumPosting,
      allowEventSubmission: platformBefore.allowEventSubmission,
      allowTournamentRegistration: platformBefore.allowTournamentRegistration,
      scheduleReadOnly: platformBefore.scheduleReadOnly,
      galleryUploadEnabled: platformBefore.galleryUploadEnabled,
      storeEnabled: platformBefore.storeEnabled,
    })
    console.log('\nState restored (Ascend features all-on, platform settings reverted).')
  }

  console.log(`\n${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
