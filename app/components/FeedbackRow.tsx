'use client'

import { useState } from 'react'
import { FeedbackSentiment } from '@prisma/client'

type QA = { question: string; answer: string }

type FeedbackData = {
  id: string
  sentiment: FeedbackSentiment
  rating: number | null
  responses: QA[]
  reviewRequested: boolean
  createdAt: string
  user: { name: string | null; belt: string }
  classSession: { date: string; class: { title: string } }
}

const SENTIMENT_STYLES: Record<FeedbackSentiment, string> = {
  positive: 'bg-green-100 text-green-700',
  neutral:  'bg-yellow-100 text-yellow-700',
  negative: 'bg-red-100 text-brand-red',
  concern:  'bg-orange-100 text-orange-700',
}

export function FeedbackRow({ feedback: f }: { feedback: FeedbackData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-smoke bg-paper">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-mist transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide shrink-0 ${SENTIMENT_STYLES[f.sentiment]}`}>
            {f.sentiment}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-ink truncate">{f.user.name ?? 'Unknown'}</p>
            <p className="text-xs text-ash">
              {f.classSession.class.title} · {new Date(f.classSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {f.rating && <span className="text-xs text-steel">{f.rating}/5</span>}
          {f.reviewRequested && <span className="text-xs text-ash">review requested</span>}
          <span className="text-xs text-ash">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && f.responses.length > 0 && (
        <div className="px-5 pb-4 border-t border-smoke pt-4 flex flex-col gap-3">
          {f.responses.map((qa, i) => (
            <div key={i}>
              <p className="text-xs text-ash uppercase tracking-wider mb-0.5">{qa.question}</p>
              <p className="text-sm text-ink">{qa.answer}</p>
            </div>
          ))}
        </div>
      )}

      {expanded && f.responses.length === 0 && (
        <p className="px-5 pb-4 pt-2 text-xs text-ash italic">No written responses.</p>
      )}
    </div>
  )
}
