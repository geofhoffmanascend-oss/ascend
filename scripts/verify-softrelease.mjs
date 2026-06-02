import { chromium } from 'playwright'
const BASE = 'http://localhost:3002'
const note = (m) => console.log(m)

async function login(page, email, pw) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', pw)
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1200)
}

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1200, height: 950 } })).newPage()

note('== login instructor1 ==')
await login(page, 'instructor1@gym.com', 'instructor1234')
note('  url: ' + page.url())

// ---- Forums: open General, post, like, edit ----
note('== forum: General ==')
await page.goto(`${BASE}/forum`, { waitUntil: 'networkidle' })
const navForums = await page.locator('header a[href="/forum"]').count()
note('  nav Forums present (default): ' + (navForums > 0 ? 'yes ✓' : 'no ✗'))
// open the General forum directly (fixed id from cleanup)
await page.goto(`${BASE}/forum/ascend-general`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// new post
await page.getByRole('button', { name: /\+ New Post/ }).click()
await page.waitForTimeout(300)
const ta = page.locator('form textarea').first()
await ta.fill('Soft-release smoke test post')
await page.locator('form button[type="submit"]').click()
await page.waitForTimeout(1000)
const hasPost = (await page.textContent('body'))?.includes('Soft-release smoke test post')
note('  post created: ' + (hasPost ? 'yes ✓' : 'no ✗'))

// like it
const likeBtn = page.getByRole('button', { name: /👍/ }).first()
await likeBtn.click()
await page.waitForTimeout(800)
const likedText = (await likeBtn.textContent())?.trim()
note('  like clicked → button text: "' + likedText + '" ' + (/1/.test(likedText ?? '') ? '✓' : '✗'))

// edit it
await page.getByRole('button', { name: /^Edit$/ }).first().click()
await page.waitForTimeout(300)
const editTa = page.locator('textarea').first()
await editTa.fill('Soft-release EDITED post')
await page.getByRole('button', { name: /^Save$/ }).first().click()
await page.waitForTimeout(900)
const edited = (await page.textContent('body'))?.includes('Soft-release EDITED post')
note('  edit saved: ' + (edited ? 'yes ✓' : 'no ✗'))
await page.screenshot({ path: '/tmp/uiverify/forum-like-edit.png', fullPage: true })

// cleanup: delete the test post
await page.getByRole('button', { name: /^✕$/ }).first().click().catch(() => {})
await page.waitForTimeout(600)

// ---- QR gating: profile (gym is non-participating → hidden) ----
note('== profile QR ==')
await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' })
const qr = (await page.textContent('body'))?.includes('Check-in QR Code')
note('  QR shown (expect NO, non-participating gym): ' + (qr ? 'shown ✗' : 'hidden ✓'))

await browser.close()
