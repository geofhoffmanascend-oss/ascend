import { NextResponse } from 'next/server'
import { getPlatformSettings } from '@/lib/platformSettings'

// Public read-only — used by server components to gate UI
export async function GET() {
  const settings = await getPlatformSettings()
  return NextResponse.json({ settings })
}
