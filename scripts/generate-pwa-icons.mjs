// Generate all PWA / app icons from a source square PNG.
// Usage: node scripts/generate-pwa-icons.mjs [sourcePath] [outDir]
//   sourcePath default: public/logo.png
//   outDir     default: public/icons
//
// Produces:
//   icon-192.png, icon-512.png            (purpose "any"  — transparent, slight padding)
//   icon-192-maskable.png, icon-512-maskable.png (purpose "maskable" — solid bg, safe-zone padding)
//   apple-touch-icon.png  (180x180, solid bg — iOS ignores transparency)
//
// This is the same pipeline the in-app gym-logo generator would use (see notes).

import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const src = path.resolve(root, process.argv[2] || 'public/logo.png')
const outDir = path.resolve(root, process.argv[3] || 'public/icons')

// Maskable safe zone: content must live within the central 80% circle.
// The pyramid is wide, so we scale to ~72% of the canvas to stay clear of corners.
const BG = { r: 250, g: 250, b: 250, alpha: 1 } // #FAFAFA (paper)

/** Resize the (trimmed) logo to `inner` px, centered on a `size` px canvas. */
async function compose(size, inner, background) {
  // Trim transparent margins so framing is tight & consistent.
  const trimmed = await sharp(src).trim().toBuffer()
  const fg = await sharp(trimmed)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  const pad = Math.round((size - inner) / 2)
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background || { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fg, top: pad, left: pad }])
    .png()
}

async function run() {
  const jobs = [
    // purpose "any" — transparent bg, fill edge-to-edge after trim
    { name: 'icon-192.png', size: 192, inner: 192 },
    { name: 'icon-512.png', size: 512, inner: 512 },
    // purpose "maskable" — solid bg, content in safe zone (~88%)
    { name: 'icon-192-maskable.png', size: 192, inner: Math.round(192 * 0.88), bg: BG },
    { name: 'icon-512-maskable.png', size: 512, inner: Math.round(512 * 0.88), bg: BG },
    // iOS home screen — solid bg, ~96%
    { name: 'apple-touch-icon.png', size: 180, inner: Math.round(180 * 0.96), bg: BG },
  ]

  for (const j of jobs) {
    const img = await compose(j.size, j.inner, j.bg)
    const out = path.join(outDir, j.name)
    await img.toFile(out)
    console.log(`✓ ${j.name}  (${j.size}x${j.size}${j.bg ? ', solid bg' : ', transparent'})`)
  }
  console.log(`\nDone. Source: ${path.relative(root, src)} → ${path.relative(root, outDir)}/`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
