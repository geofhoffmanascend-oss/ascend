'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Generic QR code for an arbitrary URL (Phase 58 scoreboard, etc.).
export function QRCodeUrl({ url, size = 160, caption }: { url: string; size?: number; caption?: string }) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    QRCode.toDataURL(url, { width: size, margin: 1, color: { dark: '#0A0A0A', light: '#FAFAFA' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(''))
  }, [url, size])

  if (!dataUrl) return <div className="bg-mist animate-pulse" style={{ width: size, height: size }} />

  return (
    <div className="flex flex-col items-center gap-2">
      <img src={dataUrl} alt="QR code" className="border border-smoke" style={{ width: size, height: size }} />
      {caption && <p className="text-xs text-ash text-center">{caption}</p>}
    </div>
  )
}
