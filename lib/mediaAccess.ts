import prisma from './database'

export async function canViewMedia(
  mediaItem: { visibility: string; uploaderId: string; gymId: string | null },
  mediaItemId: string,
  viewerUserId: string | null,
  viewerGymId: string | null,
  viewerRoles: string[]
): Promise<boolean> {
  if (viewerRoles.includes('site_admin')) return true

  switch (mediaItem.visibility) {
    case 'public':
      return true

    case 'gym_only':
      if (!viewerUserId || !mediaItem.gymId) return false
      return viewerGymId === mediaItem.gymId

    case 'private':
      if (!viewerUserId) return false
      return viewerUserId === mediaItem.uploaderId

    case 'custom':
      if (!viewerUserId) return false
      if (viewerUserId === mediaItem.uploaderId) return true
      const grant = await prisma.mediaAccess.findUnique({
        where: { mediaItemId_userId: { mediaItemId, userId: viewerUserId } },
      })
      return grant !== null

    default:
      return false
  }
}

// Efficient compound OR filter for gallery list queries
export function visibilityFilter(userId: string, gymId: string | null) {
  return {
    OR: [
      { visibility: 'public' as const },
      { visibility: 'gym_only' as const, gymId: gymId ?? 'none' },
      { visibility: 'private' as const, uploaderId: userId },
      {
        visibility: 'custom' as const,
        OR: [
          { uploaderId: userId },
          { accessGrants: { some: { userId } } },
        ],
      },
    ],
  }
}
