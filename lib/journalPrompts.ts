export type JournalPrompt = {
  key: string
  category: 'wellness' | 'training' | 'reflection'
  question: string
  inputType: 'text' | 'textarea' | 'rating'
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  { key: 'sleep',             category: 'wellness',   question: 'Hours of sleep',                          inputType: 'text' },
  { key: 'energy',            category: 'wellness',   question: 'Energy level (1–5)',                      inputType: 'rating' },
  { key: 'diet',              category: 'wellness',   question: 'How was your diet today?',                inputType: 'text' },
  { key: 'conditioning',      category: 'wellness',   question: 'Conditioning (1–5)',                      inputType: 'rating' },
  { key: 'class_objective',   category: 'training',   question: 'Class objective',                         inputType: 'textarea' },
  { key: 'technique_notes',   category: 'training',   question: 'Technique notes',                         inputType: 'textarea' },
  { key: 'rolling_intensity', category: 'training',   question: 'Rolling intensity (1–5)',                 inputType: 'rating' },
  { key: 'drill_partner',     category: 'training',   question: 'Was I a good drill partner?',             inputType: 'text' },
  { key: 'focus_learning',    category: 'training',   question: 'Focus while learning (1–5)',              inputType: 'rating' },
  { key: 'focus_rolling',     category: 'training',   question: 'Focus while rolling (1–5)',               inputType: 'rating' },
  { key: 'personal_goal',     category: 'reflection', question: 'Daily personal goal',                     inputType: 'textarea' },
  { key: 'goal_accomplished', category: 'reflection', question: 'Did you accomplish it? Why?',             inputType: 'textarea' },
  { key: 'comfort_zone',      category: 'reflection', question: 'Did you push out of your comfort zone?',  inputType: 'textarea' },
  { key: 'key_takeaways',     category: 'reflection', question: 'Key takeaways',                           inputType: 'textarea' },
  { key: 'future_items',      category: 'reflection', question: 'Future items to work on',                 inputType: 'textarea' },
]

export const PROMPT_MAP = Object.fromEntries(JOURNAL_PROMPTS.map(p => [p.key, p]))

export type GuidedResponse = { promptKey: string; question: string; answer: string }
