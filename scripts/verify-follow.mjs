import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3002'
const OUT = '/tmp/uiverify'
mkdirSync(OUT, { recursive: true })
const S2 = 'cmouhrwbg0004qmj6v88xgqne' // student2

const note = (m) => console.log(m)

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1200)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1100, height: 950 } })
const page = await ctx.newPage()

note('== login student1 ==')
await login(page, 'student1@gym.com', 'student1234')

note('== profile of student2 ==')
await page.goto(`${BASE}/profile/${S2}`, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${OUT}/profile-before-follow.png`, fullPage: true })
const body = (await page.textContent('body')) || ''
for (const n of ['followers', 'following', 'Posts']) note(`  ${body.includes(n) ? '✓' : '✗'} contains "${n}"`)

// Capture follower count before
const beforeText = (await page.textContent('body')) || ''
const beforeMatch = beforeText.match(/(\d+)\s+followers/)
note(`  follower line before: ${beforeMatch ? beforeMatch[0] : 'n/a'}`)

note('== click Follow ==')
const followBtn = page.getByRole('button', { name: /^Follow$/ })
if (await followBtn.count()) {
  await followBtn.first().click()
  await page.waitForTimeout(1000)
  const nowFollowing = await page.getByRole('button', { name: /^Following$/ }).count()
  note(`  button now "Following": ${nowFollowing > 0 ? 'yes ✓' : 'no ✗'}`)
} else {
  note('  ✗ Follow button not found')
}

// Reload to confirm persisted follower count + state
await page.reload({ waitUntil: 'networkidle' })
const afterText = (await page.textContent('body')) || ''
const afterMatch = afterText.match(/(\d+)\s+followers/)
note(`  follower line after reload: ${afterMatch ? afterMatch[0] : 'n/a'}`)
note(`  persisted as Following: ${(await page.getByRole('button', { name: /^Following$/ }).count()) > 0 ? 'yes ✓' : 'no ✗'}`)
await page.screenshot({ path: `${OUT}/profile-after-follow.png`, fullPage: true })

note('== feed ==')
await page.goto(`${BASE}/feed`, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${OUT}/feed.png`, fullPage: true })
const feed = (await page.textContent('body')) || ''
note(`  feed renders Following header: ${feed.includes('Following') ? '✓' : '✗'}`)

note('== cleanup: unfollow ==')
const del = await page.evaluate(async (id) => {
  const r = await fetch(`/api/users/${id}/follow`, { method: 'DELETE' })
  return r.status
}, S2).catch(() => 'err')
note(`  DELETE follow -> ${del}`)

await browser.close()
note('\nScreenshots in ' + OUT)
