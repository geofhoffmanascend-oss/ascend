import { ClassGroup } from '@prisma/client'

export const CLASS_TYPE_TO_GROUP: Record<string, ClassGroup> = {
  gi:                 ClassGroup.grappling,
  nogi:               ClassGroup.grappling,
  fundamentals:       ClassGroup.grappling,
  nogi_fundamentals:  ClassGroup.grappling,
  open_mat:           ClassGroup.grappling,
  wrestling:          ClassGroup.grappling,
  muay_thai:          ClassGroup.striking,
  self_defense:       ClassGroup.striking,
  kids:               ClassGroup.kids,
  competition_prep:   ClassGroup.competition,
  seminar:            ClassGroup.seminar,
}

export const GROUP_LABELS: Record<ClassGroup, string> = {
  grappling:   'Grappling',
  striking:    'Striking',
  kids:        'Kids',
  competition: 'Competition',
  seminar:     'Seminars',
}

export const GROUP_DESCRIPTIONS: Record<ClassGroup, string> = {
  grappling:   'Gi, No-Gi, Fundamentals, Wrestling, Open Mat',
  striking:    'Muay Thai, Self Defense / Krav Maga',
  kids:        'Kids classes',
  competition: 'Competition prep',
  seminar:     'Special seminars and workshops',
}

export const ALL_GROUPS = Object.values(ClassGroup) as ClassGroup[]

export function classTypeToGroup(classType: string): ClassGroup | null {
  return CLASS_TYPE_TO_GROUP[classType] ?? null
}

// Seed IDs for group forums — deterministic so they can be referenced reliably
export const GROUP_FORUM_IDS: Record<ClassGroup, string> = {
  grappling:   'forum-group-grappling',
  striking:    'forum-group-striking',
  kids:        'forum-group-kids',
  competition: 'forum-group-competition',
  seminar:     'forum-group-seminar',
}
