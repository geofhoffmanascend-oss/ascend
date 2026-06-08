// Import the DMV BJJ gym list as claimable community gyms (free tier, no owner).
// Matches existing gyms by normalized name (so "Ascend Jiu Jitsu" updates the
// existing one + gets its address). Geocodes each via Google Maps.
import 'dotenv/config'
import * as dl from 'dotenv'; dl.config({ path: '.env.local', override: true })
import fs from 'fs'
import prisma from '../lib/database'
import { geocodeParts } from '../lib/geocode'

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(jiu[\s-]?jitsu|bjj|academy|gym|martial arts|mma)\b/g, '')
    .replace(/\s+/g, ' ').trim()
}
function baseSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'gym'
}
async function uniqueSlug(base: string) {
  let s = base, i = 2
  while (await prisma.gym.findUnique({ where: { slug: s } })) s = `${base}-${i++}`
  return s
}
const v = (x: string | undefined) => { const t = (x ?? '').trim(); return t || null }

async function main() {
  const rows: Record<string, string>[] = JSON.parse(fs.readFileSync('scripts/dmv-gyms.json', 'utf8'))
  const gyms = rows.filter(r => {
    const n = (r['Gym Name'] ?? '').trim()
    return n && !n.startsWith('▶') && (r['City'] || r['Address'])
  })

  const existing = await prisma.gym.findMany({ select: { id: true, name: true } })
  const byNorm = new Map(existing.map(g => [norm(g.name), g.id]))

  let created = 0, updated = 0, geocoded = 0
  for (const r of gyms) {
    const name = r['Gym Name'].trim()
    const fields = {
      address: v(r['Address']), city: v(r['City']), state: v(r['State']), zip: v(r['Zip']),
      phone: v(r['Phone']), website: v(r['Website']), description: v(r['Notes / Specialty']),
    }
    // Only set non-empty list values (don't clobber existing data with blanks).
    const setData = Object.fromEntries(Object.entries(fields).filter(([, val]) => val != null))

    let id = byNorm.get(norm(name))
    if (id) {
      await prisma.gym.update({ where: { id }, data: setData })
      updated++
    } else {
      const slug = await uniqueSlug(baseSlug(name))
      const g = await prisma.gym.create({ data: { name, slug, participatingStatus: 'free', ...fields } })
      id = g.id
      byNorm.set(norm(name), id)
      created++
    }

    const g = await prisma.gym.findUnique({ where: { id }, select: { lat: true, address: true, city: true, state: true, zip: true } })
    if (g && g.lat == null && (g.address || g.city)) {
      const c = await geocodeParts(g)
      if (c) { await prisma.gym.update({ where: { id }, data: { lat: c.lat, lng: c.lng } }); geocoded++ }
    }
  }
  console.log({ totalRows: gyms.length, created, updated, geocoded })
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => process.exit(0))
