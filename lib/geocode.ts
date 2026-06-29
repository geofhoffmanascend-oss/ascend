// Shared geocoding via Google Maps Geocoding API. Used by find-instructor
// (Phase 42), the future gym-finder, and "events/open mats near me" (Phase 28).
// Server-side; cache the result on the entity (lat/lng) — don't re-geocode
// unchanged addresses.

export type LatLng = { lat: number; lng: number }

export type AddressParts = {
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

export function addressString(p: AddressParts): string {
  return [p.address, p.city, p.state, p.zip].map(s => s?.trim()).filter(Boolean).join(', ')
}

// Geocode an address (or any place string) → {lat,lng} or null.
// Uses Google when a key is configured, otherwise falls back to OpenStreetMap
// Nominatim (no key required) so location search works everywhere.
export async function geocode(query: string): Promise<LatLng | null> {
  if (!query?.trim()) return null
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (key) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.status === 'OK' && data.results?.[0]) {
        const loc = data.results[0].geometry.location
        return { lat: loc.lat, lng: loc.lng }
      }
      if (data.status && data.status !== 'ZERO_RESULTS') {
        console.warn('[geocode]', data.status, data.error_message ?? '')
      }
    } catch { /* fall through to Nominatim */ }
  }
  return geocodeNominatim(query)
}

// Free fallback geocoder (OpenStreetMap). Their usage policy requires a User-Agent
// and low volume — fine for occasional provider/search geocoding.
async function geocodeNominatim(query: string): Promise<LatLng | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'AscendIt/1.0 (jiu-jitsu app)' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || !data[0]?.lat || !data[0]?.lon) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export function geocodeParts(p: AddressParts): Promise<LatLng | null> {
  return geocode(addressString(p))
}

// Great-circle distance in miles.
export function distanceMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}
