import { ScoreboardClient } from './ScoreboardClient'

export const metadata = { title: 'Scoreboard' }

export default async function ScoreboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ScoreboardClient slug={slug} />
}
