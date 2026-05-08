/**
 * Generates PWA icons in public/icons/.
 * Run once: npx tsx scripts/generate-icons.ts
 * Replace the output files with real brand artwork when ready.
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public', 'icons')
fs.mkdirSync(OUT, { recursive: true })

// Brand red #CC0000
const RED  = { r: 204, g: 0,   b: 0,   alpha: 1 }
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

async function makeIcon(size: number, filename: string, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : 0
  const innerSize = size - padding * 2

  // Red background
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: RED },
  }).png().toBuffer()

  // White "A" lettermark via SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${innerSize}" height="${innerSize}" viewBox="0 0 100 100">
      <text
        x="50" y="72"
        font-family="Arial Black, sans-serif"
        font-weight="900"
        font-size="80"
        text-anchor="middle"
        fill="white"
      >A</text>
    </svg>`

  const letterBuf = await sharp(Buffer.from(svg)).png().toBuffer()

  await sharp(bg)
    .composite([{ input: letterBuf, top: padding, left: padding }])
    .toFile(path.join(OUT, filename))

  console.log(`  ✓ ${filename} (${size}×${size})`)
}

async function main() {
  console.log('Generating PWA icons…')
  await makeIcon(192, 'icon-192.png')
  await makeIcon(512, 'icon-512.png')
  await makeIcon(192, 'icon-192-maskable.png', true)
  await makeIcon(512, 'icon-512-maskable.png', true)
  await makeIcon(180, 'apple-touch-icon.png')
  console.log(`Done → public/icons/`)
}

main().catch(e => { console.error(e); process.exit(1) })
