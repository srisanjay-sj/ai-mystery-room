import { computeScore } from './scoring.js'

export function toPublicCase(c) {
  const found = c.progress.discoveredClueIds
  const hintsUsed = c.progress.hintsUsed

  return {
    id: c._id,
    title: c.title,
    difficulty: c.difficulty,
    story: c.story,
    status: c.status,
    suspects: c.suspects,
    clues: c.clues.map((clue) => {
      const discovered = found.includes(clue.id)
      return {
        id: clue.id,
        title: clue.title,
        location: clue.location,
        discovered,
        ...(discovered && { description: clue.description }),
      }
    }),
    hints: c.hints.slice(0, hintsUsed),
    hintsUsed,
    hintsTotal: c.hints.length,
    progress: { cluesFound: found.length, cluesTotal: c.clues.length },
    scorePreview: computeScore({
      difficulty: c.difficulty,
      discoveredCount: found.length,
      hintsUsed,
      correct: true,
    }).total,
  }
}