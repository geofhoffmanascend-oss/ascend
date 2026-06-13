import { ConsoleClient } from './ConsoleClient'

export const metadata = { title: 'Match Console' }

export default async function ConsolePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params
  return <ConsoleClient tableId={tableId} />
}
