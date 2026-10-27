import { DIFFICULTY_CONFIG } from '../validators/mystery.js'

export function computeScore({ difficulty, discoveredCount, hintsUsed, correct }) {
  const base = correct ? DIFFICULTY_CONFIG[difficulty].base : 0
  const clueBonus = 5 * discoveredCount
  const hintPenalty = 10 * hintsUsed
  const total = Math.max(0, base + clueBonus - hintPenalty)
  return { base, clueBonus, hintPenalty, total }
}