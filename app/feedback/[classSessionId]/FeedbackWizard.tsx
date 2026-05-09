'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'rating' | 'questions' | 'review' | 'done'
type Sentiment = 'positive' | 'neutral' | 'negative' | 'concern'

type QA = { question: string; answer: string }

const QUESTIONS: Record<Sentiment, { question: string; type: 'textarea' | 'yesno' }[]> = {
  positive: [
    { question: 'What did you enjoy most about today\'s class?', type: 'textarea' },
    { question: 'Any specific techniques or moments that stood out?', type: 'textarea' },
  ],
  neutral: [
    { question: 'What did you enjoy?', type: 'textarea' },
    { question: 'What could have been better?', type: 'textarea' },
  ],
  negative: [
    { question: 'What could have been better?', type: 'textarea' },
    { question: 'Is there a specific concern you\'d like to share with your instructor?', type: 'textarea' },
    { question: 'Would you like an instructor to follow up with you?', type: 'yesno' },
  ],
  concern: [
    { question: 'Please describe your concern.', type: 'textarea' },
    { question: 'Would you like an instructor to follow up with you?', type: 'yesno' },
  ],
}

function sentimentFromRating(rating: number): Sentiment {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}

export function FeedbackWizard({ classSessionId, reviewUrl }: { classSessionId: string; reviewUrl: string | null }) {
  const [step, setStep] = useState<Step>('rating')
  const [rating, setRating] = useState(0)
  const [sentiment, setSentiment] = useState<Sentiment>('positive')
  const [answers, setAnswers] = useState<string[]>([])
  const [anonymous, setAnonymous] = useState(false)
  const [saving, setSaving] = useState(false)

  const questions = QUESTIONS[sentiment]

  function handleRatingSelect(r: number) {
    setRating(r)
    const s = sentimentFromRating(r)
    setSentiment(s)
    setAnswers(new Array(QUESTIONS[s].length).fill(''))
    setStep('questions')
  }

  function setAnswer(i: number, val: string) {
    setAnswers(prev => { const a = [...prev]; a[i] = val; return a })
  }

  async function handleSubmit() {
    setSaving(true)
    const responses: QA[] = questions
      .map((q, i) => ({ question: q.question, answer: answers[i] ?? '' }))
      .filter(qa => qa.answer.trim())

    const showReview = sentiment === 'positive' && rating >= 4 && !!reviewUrl

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classSessionId,
        sentiment,
        rating,
        responses,
        reviewRequested: showReview,
        anonymous,
      }),
    })

    setSaving(false)
    setStep(showReview ? 'review' : 'done')
  }

  if (step === 'rating') {
    return (
      <div className="border border-smoke bg-paper p-6 flex flex-col gap-6">
        <p className="font-display text-lg text-ink">How was today's class?</p>
        <div className="flex gap-3 justify-center">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              onClick={() => handleRatingSelect(n)}
              className="w-14 h-14 border-2 border-smoke text-xl font-bold text-steel hover:border-brand-red hover:text-brand-red transition-colors"
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-ash px-1">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>
    )
  }

  if (step === 'questions') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 text-xs font-bold uppercase tracking-widest ${
            sentiment === 'positive' ? 'bg-green-100 text-green-700' :
            sentiment === 'neutral'  ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-brand-red'
          }`}>
            {rating}/5 — {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
          </div>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="flex flex-col gap-2">
            <label className="text-sm text-ink font-medium">{q.question}</label>
            {q.type === 'yesno' ? (
              <div className="flex gap-3">
                {['Yes', 'No'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(i, opt)}
                    className={`px-5 py-2 border text-sm font-bold transition-colors ${
                      answers[i] === opt
                        ? 'bg-brand-red border-brand-red text-paper'
                        : 'border-smoke text-steel hover:border-steel'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[i] ?? ''}
                onChange={e => setAnswer(i, e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
                placeholder="Optional…"
              />
            )}
          </div>
        ))}

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative shrink-0">
            <input type="checkbox" className="sr-only" checked={anonymous} onChange={() => setAnonymous(a => !a)} />
            <div className={`w-10 h-5 rounded-full transition-colors ${anonymous ? 'bg-brand-red' : 'bg-smoke'}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow transition-transform ${anonymous ? 'translate-x-5' : ''}`} />
          </div>
          <div>
            <p className="text-sm text-ink font-medium">Submit anonymously</p>
            <p className="text-xs text-ash">Your name and belt won't be shown to instructors.</p>
          </div>
        </label>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="border border-smoke bg-paper p-8 flex flex-col items-center gap-5 text-center">
        <p className="font-display text-lg text-ink">Thanks for the feedback!</p>
        <p className="text-sm text-ash max-w-sm">
          We're glad you had a great class. Would you be willing to share your experience with others? It helps the gym grow.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a
            href={reviewUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setStep('done')}
            className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors text-center"
          >
            Leave a Review
          </a>
          <button
            onClick={() => setStep('done')}
            className="px-6 py-3 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
          >
            No thanks
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-smoke bg-paper p-8 flex flex-col items-center gap-4 text-center">
      <p className="font-display text-lg text-ink">Thank you!</p>
      <p className="text-sm text-ash">Your feedback has been recorded.</p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
