import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export function getWatermarkedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        overlay: {
          font_family: 'Arial',
          font_size:   60,
          font_weight: 'bold',
          text:        'ASCEND BJJ',
        },
        color:   'white',
        opacity: 70,
        gravity: 'center',
      },
    ],
    secure: true,
  })
}

export function uploadFromBuffer(buffer: Buffer, folder = 'ascend'): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    ).end(buffer)
  })
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
