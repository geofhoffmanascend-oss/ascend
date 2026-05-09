// Browser-safe Cloudinary URL builder — no SDK, no Node.js deps
export function getWatermarkedUrl(publicId: string): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloud || !publicId) return ''
  return `https://res.cloudinary.com/${cloud}/image/upload/l_text:Arial_60_bold:ASCEND%20BJJ,co_white,o_70,g_center/${publicId}`
}
