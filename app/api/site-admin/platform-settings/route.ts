import { NextRequest, NextResponse } from 'next/server'
import { requireSiteAdmin } from '@/lib/siteAdminAuth'
import { getPlatformSettings, upsertPlatformSettings } from '@/lib/platformSettings'

export async function GET() {
  const { error } = await requireSiteAdmin()
  if (error) return error
  const settings = await getPlatformSettings()
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSiteAdmin()
  if (error) return error
  const body = await req.json()
  const settings = await upsertPlatformSettings(body)
  return NextResponse.json({ settings })
}
