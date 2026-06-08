// Focused Playwright UI smoke: registers a real test user via the UI, then
// walks the highest-risk screens as that authenticated user. Cleans up after.
//   (dev server must be running on :3002)
import 'dotenv/config'
import * as dl from 'dotenv'; dl.config({ path: '.env.local', override: true })
import { chromium } from 'playwright'
import prisma from '../lib/database'

const BASE = 'http://localhost:3002'
const TAG = `smokeui${Date.now()}`
const EMAIL = `${TAG}@smoke.test`

let pass = 0, fail = 0
const fails: string[] = []
function check(cond: boolean, msg: string) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`) } else { fail++; fails.push(msg); console.log(`  ✗ ${msg}`) }
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`) })

  async function has(text: string) { return (await page.locator(`text=${text}`).count()) > 0 }

  console.log(`\n=== UI SMOKE (${TAG}) ===\n`)

  // 1. Public pages
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  check(await has('Join as an athlete'), 'landing page renders with CTAs')
  await page.goto(`${BASE}/terms`, { waitUntil: 'networkidle' })
  check(await has('Terms of Service'), 'Terms page renders')
  await page.goto(`${BASE}/privacy`, { waitUntil: 'networkidle' })
  check(await has('Privacy Policy'), 'Privacy page renders')

  // 2. Register a new user
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' })
  check(await has('agree to our'), 'register shows Terms/Privacy agreement')
  await page.fill('input[type=text]', `UI Smoke ${TAG}`)
  await page.fill('input[type=email]', EMAIL)
  await page.fill('input[type=password]', 'smoketest123')
  await page.click('button:has-text("Create Account")')
  await page.waitForURL('**/onboarding', { timeout: 20000 }).catch(() => {})
  check(page.url().includes('/onboarding'), 'register → redirected to onboarding')
  check(await has('set up your profile') || await has('Welcome'), 'onboarding step 1 renders')
  await page.screenshot({ path: '/tmp/smoke-ui-onboarding.png' })

  // 3. Advance onboarding one step
  await page.click('button:has-text("Next")').catch(() => {})
  const advanced = await page.waitForSelector('text=Which gym do you train at?', { timeout: 10000 }).then(() => true).catch(() => false)
  check(advanced, 'onboarding step 1 → step 2 (gym) advances')

  // 4. Key authed pages (session is active from registration)
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  check(!page.url().includes('/login'), 'dashboard loads (authenticated)')
  await page.goto(`${BASE}/lessons`, { waitUntil: 'networkidle' })
  check(await has('Private Lessons'), 'lessons page renders')
  check(await has('beyond my gym'), 'lessons shows "search beyond my gym"')
  await page.goto(`${BASE}/lessons/new`, { waitUntil: 'networkidle' })
  check(await has('Instructor'), 'request-lesson page renders')
  await page.goto(`${BASE}/profile/edit`, { waitUntil: 'networkidle' })
  check(await has('Profile Picture'), 'profile edit shows photo upload')
  await page.goto(`${BASE}/invite`, { waitUntil: 'networkidle' })
  check(await has('Invite friends') || await has('invite link'), 'invite page renders')
  await page.screenshot({ path: '/tmp/smoke-ui-lessons.png' })

  check(errors.length === 0, `no page errors / 500s (${errors.length})`)
  if (errors.length) console.log('  errors:', errors.slice(0, 5))

  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`)
  if (fail) console.log('FAILURES:\n' + fails.map(f => '  - ' + f).join('\n'))

  // Cleanup the test user
  const u = await prisma.user.findFirst({ where: { email: EMAIL }, select: { id: true } })
  if (u) {
    await prisma.post.deleteMany({ where: { authorId: u.id } })
    await prisma.directMessage.deleteMany({ where: { OR: [{ senderId: u.id }, { recipientId: u.id }] } })
    await prisma.user.delete({ where: { id: u.id } })
    console.log('Cleaned up test user.')
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => process.exit(fail ? 1 : 0))
