import { chromium } from 'playwright'

const BASE = 'http://localhost:3002'
const OUT = '/tmp/uiverify'
import { mkdirSync } from 'node:fs'
mkdirSync(OUT, { recursive: true })

const log = []
const note = (m) => { log.push(m); console.log(m) }

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1500)
}

async function check(page, label, needles) {
  const body = (await page.textContent('body')) || ''
  for (const n of needles) {
    note(`  ${body.includes(n) ? '✓' : '✗'} ${label}: "${n}"`)
  }
}

const browser = await chromium.launch()

// ---------- DESKTOP: student dashboard + forum ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  note('== DESKTOP / student1 ==')
  await login(page, 'student1@gym.com', 'student1234')
  note(`  url after login: ${page.url()}`)

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}/dashboard-desktop.png`, fullPage: true })
  await check(page, 'dashboard', ['This Week', 'Community', 'Messages', 'Forums', 'Events'])

  await page.goto(`${BASE}/forum`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}/forum-desktop.png`, fullPage: true })
  await check(page, 'forum', ['Forums', 'General'])
  const showAll = await page.locator('button', { hasText: /Show all available forums/i }).count()
  note(`  show-all button present: ${showAll > 0 ? 'yes' : 'no (no hidden forums for this user)'}`)
  await ctx.close()
}

// ---------- MOBILE: student dashboard + forum ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const page = await ctx.newPage()
  note('== MOBILE / student1 ==')
  await login(page, 'student1@gym.com', 'student1234')
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}/dashboard-mobile.png`, fullPage: true })
  await page.goto(`${BASE}/forum`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}/forum-mobile.png`, fullPage: true })
  await ctx.close()
}

// ---------- MOBILE: onboarding (throwaway no-gym user) → step 6 ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const page = await ctx.newPage()
  note('== MOBILE / onboarding (throwaway) ==')
  const email = `uitest+${Date.now()}@ascend.test`
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' })
  await page.fill('input[placeholder="John Smith"]', 'UI Test User')
  await page.fill('input[type="email"]', email)
  await page.fill('input[placeholder="8+ characters"]', 'Test1234!')
  await Promise.all([
    page.waitForURL(/\/onboarding/, { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1500)
  note(`  registered ${email}, url: ${page.url()}`)

  // Click through to step 6, taking the no-gym path.
  const advanceLabels = [/^I train independently$/, /^Next →$/, /^Skip for now$/, /^Save Reflection →$/]
  for (let i = 0; i < 12; i++) {
    const body = (await page.textContent('body')) || ''
    if (body.includes("You're all set!")) break
    let clicked = false
    for (const re of advanceLabels) {
      const btn = page.locator('button', { hasText: re }).first()
      if (await btn.count() && await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {})
        await page.waitForTimeout(900)
        clicked = true
        break
      }
    }
    if (!clicked) { note(`  stuck at step ${i}; no advance button found`); break }
  }
  await page.screenshot({ path: `${OUT}/onboarding-step6-mobile.png`, fullPage: true })
  await check(page, 'onboarding step6', ["You're all set!", 'menu', 'open mats'])

  // Clean up the throwaway account.
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' }).catch(() => {})
  const del = await page.evaluate(async () => {
    const r = await fetch('/api/account', { method: 'DELETE' })
    return r.status
  }).catch(() => 'err')
  note(`  cleanup DELETE /api/account -> ${del}`)
  await ctx.close()
}

await browser.close()
note('\nScreenshots in ' + OUT)
