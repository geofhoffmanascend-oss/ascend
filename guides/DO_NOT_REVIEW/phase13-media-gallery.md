# Phase 13 — Media Archive / Gallery

## Stack
- Photos: Cloudinary (upload, watermark via URL transformation)
- Videos: YouTube/Vimeo URL links (thumbnail from YouTube oEmbed)
- Anyone logged in can upload
- `forSale` flag: watermarked preview shown publicly; Phase 14 wires up purchase for original

## Schema
- `MediaType` enum: `photo`, `video_link`
- `MediaItem`: id, uploaderId, url (Cloudinary URL or video link), publicId (Cloudinary), thumbnailUrl, type, caption, forSale, price, createdAt
- `MediaTag`: id, mediaItemId, userId; @@unique([mediaItemId, userId])
- User relations: uploadedMedia, mediaTags

## Requires prisma db push

## Files
### New
- `lib/cloudinary.ts` — SDK config + watermark URL helper
- `app/api/media/route.ts` — GET list, POST upload/video-link
- `app/api/media/[id]/route.ts` — PATCH (caption/forSale/price), DELETE
- `app/api/media/[id]/tags/route.ts` — POST add tag
- `app/api/media/[id]/tags/[userId]/route.ts` — DELETE remove tag
- `app/gallery/page.tsx` — gallery grid SSR shell
- `app/gallery/GalleryClient.tsx` — client grid + filter + upload trigger
- `app/gallery/UploadModal.tsx` — photo upload or video URL + caption + tags
- `app/gallery/MediaModal.tsx` — full view, tags, edit (owner/admin)

### Modified
- `prisma/schema.prisma`
- `app/components/Header.tsx` — add Gallery nav link
- `.env.local` — CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (placeholders)

## Watermark
Cloudinary URL transformation — text overlay "ASCEND BJJ" centered, white, 70% opacity.
Applied via `cloudinary.url(publicId, { transformation: [...] })` — no extra storage needed.

## Video thumbnails
YouTube: `https://img.youtube.com/vi/{videoId}/hqdefault.jpg`
Extract videoId from `youtu.be/{id}` or `youtube.com/watch?v={id}` or `youtube.com/shorts/{id}`
