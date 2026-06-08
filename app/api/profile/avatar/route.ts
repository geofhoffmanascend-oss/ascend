import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { uploadFromBuffer } from '@/lib/cloudinary'

// POST /api/profile/avatar — upload a profile picture; returns its URL.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are supported' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 8MB' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { url } = await uploadFromBuffer(buffer, 'ascend/avatars')
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[api/profile/avatar]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
