import prisma from './database'

// Phase 56 — recompute and cache an instructor's average rating + count.
export async function recomputeInstructorRating(instructorId: string): Promise<void> {
  const agg = await prisma.instructorReview.aggregate({
    where: { instructorId },
    _avg: { rating: true },
    _count: { _all: true },
  })
  await prisma.user.update({
    where: { id: instructorId },
    data: {
      ratingAvg: agg._count._all > 0 ? agg._avg.rating : null,
      ratingCount: agg._count._all,
    },
  })
}
