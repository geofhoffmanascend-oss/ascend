// Verify the Google Maps key works, then geocode gyms missing lat/lng.
import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
dotenvLocal.config({ path: '.env.local', override: true })
import prisma from '../lib/database'
import { geocode, geocodeParts } from '../lib/geocode'

async function main() {
  // 1) Key sanity check
  const test = await geocode('Denver, CO')
  console.log('Key test — "Denver, CO" ->', test ?? 'FAILED (check key / Geocoding API enabled)')
  if (!test) process.exit(1)

  // 2) Geocode gyms that have an address but no coords
  const gyms = await prisma.gym.findMany({
    select: { id: true, name: true, address: true, city: true, state: true, zip: true, lat: true, lng: true },
  })
  for (const g of gyms) {
    if (g.lat != null && g.lng != null) { console.log(`• ${g.name}: already geocoded`); continue }
    const coords = await geocodeParts(g)
    if (!coords) { console.log(`⚠ ${g.name}: no address / not found`); continue }
    await prisma.gym.update({ where: { id: g.id }, data: { lat: coords.lat, lng: coords.lng } })
    console.log(`✓ ${g.name}: ${coords.lat}, ${coords.lng}`)
  }
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => process.exit(0))
