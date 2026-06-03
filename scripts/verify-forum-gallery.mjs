import { chromium } from 'playwright'
const BASE = 'http://localhost:3002'
const FORUM = 'ascend-general'
const IMG = 'public/icons/icon-192.png'
const note = (m) => console.log(m)

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', 'instructor1@gym.com')
  await page.fill('input[type="password"]', 'instructor1234')
  await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}), page.click('button[type="submit"]')])
  await page.waitForTimeout(1000)
}

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1100, height: 950 } })).newPage()
await login(page)

// main gallery count BEFORE (should stay the same — forum media excluded)
await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle' })
const beforeImgs = await page.locator('main img, img').count()
note(`main gallery <img> count before: ${beforeImgs}`)

// post a photo to the General forum
note('== posting photo to General ==')
await page.goto(`${BASE}/forum/${FORUM}`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /\+ New Post/ }).click()
await page.waitForTimeout(300)
await page.locator('form textarea').first().fill('Forum gallery test photo')
await page.locator('form input[type="file"]').setInputFiles(IMG)
await page.waitForTimeout(300)
await page.locator('form button[type="submit"]').click()
await page.waitForTimeout(2500) // cloudinary upload
const inlineImg = await page.locator('img[src*="cloudinary"], img[src*="res.cloudinary"]').count()
note(`  inline image in thread: ${inlineImg > 0 ? 'yes ✓' : 'no ✗'}`)

// forum gallery shows it
await page.goto(`${BASE}/forum/${FORUM}/gallery`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const fg = await page.locator('img[src*="cloudinary"]').count()
note(`  forum gallery shows photo: ${fg > 0 ? 'yes ✓' : 'no ✗'}`)

// main gallery still excludes it
await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const afterImgs = await page.locator('main img, img').count()
const cloud = await page.locator('img[src*="cloudinary"]').count()
note(`  main gallery <img> after: ${afterImgs} (cloudinary forum imgs: ${cloud}) → forum photo excluded: ${afterImgs === beforeImgs ? '✓' : '⚠️ check'}`)

// cleanup: delete the test post (cascade removes the MediaItem)
note('== cleanup ==')
await page.goto(`${BASE}/forum/${FORUM}`, { waitUntil: 'networkidle' })
const del = await page.evaluate(async () => {
  const r = await fetch('/api/forums/ascend-general/posts')
  return r.status // GET may not exist; fall back below
}).catch(() => 0)
// delete via the UI ✕ on the test post
const x = page.getByRole('button', { name: /^✕$/ }).first()
if (await x.count()) { await x.click(); await page.waitForTimeout(800); note('  deleted test post via UI ✓') }
else note('  ⚠️ could not find delete button — remove the test post manually')

await browser.close()
