import prisma from '@/lib/database'

export async function getGymSettings() {
  const settings = await prisma.gymSettings.findFirst()
  return settings ?? { reviewUrl: null }
}
