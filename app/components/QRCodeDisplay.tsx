'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QRCodeDisplay({ token }: { token: string }) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/checkin/${token}`, { width: 160, margin: 1, color: { dark: '#0A0A0A', light: '#FAFAFA' } })
      .then(setDataUrl)
  }, [token])

  if (!dataUrl) return <div className="w-40 h-40 bg-mist animate-pulse" />

  return (
    <div className="flex flex-col items-center gap-2">
      <img src={dataUrl} alt="Your check-in QR code" className="w-40 h-40 border border-smoke" />
      <p className="text-xs text-ash text-center">Scan at the gym to check in</p>
    </div>
  )
}
