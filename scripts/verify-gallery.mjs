import { chromium } from 'playwright'
const BASE = 'http://localhost:3002'
const CHECK = process.env.CHECK
const note = (m) => console.log(m)

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', 'student1@gym.com')
  await page.fill('input[type="password"]', 'student1234')
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1000)
}

const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage()
await login(page)

await page.goto(`${BASE}/gallery`, { waitUntil: 'networkidle' })
const url = page.url()
const navGallery = await page.locator('header a[href="/gallery"], nav a[href="/gallery"]').count()
const uploadBtn = await page.getByRole('button', { name: /\+ Upload/ }).count()

note(`CHECK=${CHECK}`)
note(`  /gallery final url: ${url}`)
note(`  nav has Gallery link: ${navGallery > 0 ? 'yes' : 'no'}`)
note(`  Upload button present: ${uploadBtn > 0 ? 'yes' : 'no'}`)

if (CHECK === 'state1') {
  // visible, upload OFF
  note(`  [expect] on /gallery: ${url.endsWith('/gallery') ? '✓' : '✗'}`)
  note(`  [expect] nav Gallery shown: ${navGallery > 0 ? '✓' : '✗'}`)
  note(`  [expect] NO upload button: ${uploadBtn === 0 ? '✓' : '✗'}`)
  const status = await page.evaluate(async () => {
    const r = await fetch('/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    return r.status
  })
  note(`  [expect] POST /api/media blocked (403): ${status} ${status === 403 ? '✓' : '✗'}`)
  await page.screenshot({ path: '/tmp/uiverify/gallery-upload-off.png', fullPage: true })
}

if (CHECK === 'state2') {
  // feature hidden
  note(`  [expect] redirected off /gallery: ${!url.endsWith('/gallery') ? '✓' : '✗'} (${url})`)
  note(`  [expect] nav Gallery hidden: ${navGallery === 0 ? '✓' : '✗'}`)
}

await browser.close()
