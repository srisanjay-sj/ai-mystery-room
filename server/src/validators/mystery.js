import { z } from 'zod'

export const DIFFICULTY_CONFIG = {
  easy: { suspects: 3, clues: 5, hints: 2, base: 100 },
  medium: { suspects: 4, clues: 7, hints: 3, base: 150 },
  hard: { suspects: 5, clues: 9, hints: 3, base: 200 },
}

const suspectSchema = z.object({
  id: z.string().regex(/^s\d+$/),
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  alibi: z.string().min(1),
  motive: z.string().min(1),
})

const clueSchema = z.object({
  id: z.string().regex(/^c\d+$/),
  title: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  pointsTo: z.array(z.string()),
})

const hintSchema = z.object({
  id: z.string().regex(/^h\d+$/),
  text: z.string().min(1),
})

const mysterySchema = z.object({
  title: z.string().min(1),
  story: z.string().min(100),
  suspects: z.array(suspectSchema),
  clues: z.array(clueSchema),
  hints: z.array(hintSchema),
  solution: z.object({
    culpritId: z.string(),
    explanation: z.string().min(30),
  }),
})

export function parseAIJson(text) {
  const cleaned = String(text || '')
    .replace(/```json|```/g, '')
    .trim()
  return JSON.parse(cleaned)
}

const unique = (arr) => new Set(arr).size === arr.length

export function validateMystery(raw, difficulty) {
  const cfg = DIFFICULTY_CONFIG[difficulty]
  const parsed = mysterySchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`Schema invalid: ${msg}`)
  }

  const m = parsed.data
  const problems = []

  if (m.suspects.length !== cfg.suspects) problems.push(`Need exactly ${cfg.suspects} suspects`)
  if (m.clues.length !== cfg.clues) problems.push(`Need exactly ${cfg.clues} clues`)
  if (m.hints.length !== cfg.hints) problems.push(`Need exactly ${cfg.hints} hints`)

  if (!unique(m.suspects.map((s) => s.id))) problems.push('Duplicate suspect ids')
  if (!unique(m.clues.map((c) => c.id))) problems.push('Duplicate clue ids')
  if (!unique(m.hints.map((h) => h.id))) problems.push('Duplicate hint ids')

  const suspectIds = m.suspects.map((s) => s.id)
  const culprit = m.suspects.find((s) => s.id === m.solution.culpritId)
  if (!culprit) problems.push('solution.culpritId does not match any suspect')

  for (const c of m.clues) {
    if (c.pointsTo.some((id) => !suspectIds.includes(id))) {
      problems.push(`Clue ${c.id} points to an unknown suspect`)
    }
  }

  if (culprit) {
    const toCulprit = m.clues.filter((c) => c.pointsTo.includes(culprit.id)).length
    const minNeeded = difficulty === 'easy' ? 2 : 3
    if (toCulprit < minNeeded) problems.push(`At least ${minNeeded} clues must point to the culprit`)

    if (difficulty !== 'easy') {
      const herring = m.clues.some((c) => c.pointsTo.some((id) => id !== culprit.id))
      if (!herring) problems.push('Need at least 1 red herring clue pointing to a non-culprit')
    }

    const name = culprit.name.toLowerCase()
    
    if (m.hints.some((h) => h.text.toLowerCase().includes(name))) {
      problems.push('Hints must not name the culprit')
    }
  }

  const explanation = m.solution.explanation.toLowerCase()
  const referenced = m.clues.filter((c) => explanation.includes(c.title.toLowerCase())).length
  if (referenced < 2) problems.push('Explanation must mention at least 2 clue titles exactly')

  if (problems.length) throw new Error(problems.join('; '))
  return m
}