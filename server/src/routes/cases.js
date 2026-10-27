import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import Case from '../models/Case.js'
import { generateMystery } from '../services/gemini.js'
import { toPublicCase } from '../services/sanitize.js'
import { computeScore } from '../services/scoring.js'

const router = Router()

const createSchema = z.object({
  premise: z.string().trim().min(10).max(300),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } })
}

const accuseSchema = z.object({
  suspectId: z.string().trim().min(1),
})

function buildResult(c) {
  const culprit = c.suspects.find((s) => s.id === c.solution.culpritId)
  const accused = c.suspects.find((s) => s.id === c.accusation.suspectId)
  const keyClues = c.clues
    .filter((clue) => clue.pointsTo.includes(c.solution.culpritId))
    .map(({ id, title, location, description }) => ({ id, title, location, description }))

  return {
    correct: c.accusation.correct,
    accused,
    culprit,
    explanation: c.solution.explanation,
    keyClues,
    score: c.score,
  }
}

// POST /api/cases : generate a mystery
router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Premise must be 10-300 characters and difficulty must be easy, medium or hard.')
  }

  const { premise, difficulty } = parsed.data

  try {
    const mystery = await generateMystery(premise, difficulty)
    const created = await Case.create({ ...mystery, premise, difficulty })
    return res.status(201).json({ case: toPublicCase(created) })
  } catch (err) {
    console.error('Create case failed:', err.message)
    return sendError(res, 502, 'AI_GENERATION_FAILED', "Couldn't build the mystery. Please try again.")
  }
})

// GET /api/cases/:id : fetch case (sanitized)
router.get('/:id', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, 'INVALID_ID', 'Invalid case id.')
  }

  const found = await Case.findById(id)
  if (!found) return sendError(res, 404, 'CASE_NOT_FOUND', 'This case does not exist.')

  return res.json({ case: toPublicCase(found) })
})

// POST /api/cases/:id/clues/:clueId/discover
router.post('/:id/clues/:clueId/discover', async (req, res) => {
  const { id, clueId } = req.params
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, 'INVALID_ID', 'Invalid case id.')

  const found = await Case.findById(id)
  if (!found) return sendError(res, 404, 'CASE_NOT_FOUND', 'This case does not exist.')
  if (found.status === 'completed') return sendError(res, 409, 'CASE_COMPLETED', 'This case is already solved.')

  const clue = found.clues.find((c) => c.id === clueId)
  if (!clue) return sendError(res, 404, 'CLUE_NOT_FOUND', 'Clue not found.')

  const updated = await Case.findByIdAndUpdate(
    id,
    { $addToSet: { 'progress.discoveredClueIds': clueId } },
    { new: true }
  )

  return res.json({
    clue: { id: clue.id, title: clue.title, location: clue.location, description: clue.description },
    progress: {
      cluesFound: updated.progress.discoveredClueIds.length,
      cluesTotal: updated.clues.length,
    },
    scorePreview: computeScore({
      difficulty: updated.difficulty,
      discoveredCount: updated.progress.discoveredClueIds.length,
      hintsUsed: updated.progress.hintsUsed,
      correct: true,
    }).total,
  })
})

// POST /api/cases/:id/hints
router.post('/:id/hints', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, 'INVALID_ID', 'Invalid case id.')

  const found = await Case.findById(id)
  if (!found) return sendError(res, 404, 'CASE_NOT_FOUND', 'This case does not exist.')
  if (found.status === 'completed') return sendError(res, 409, 'CASE_COMPLETED', 'This case is already solved.')

  const used = found.progress.hintsUsed
  if (used >= found.hints.length) return sendError(res, 409, 'NO_HINTS_LEFT', 'No hints left for this case.')

  const updated = await Case.findOneAndUpdate(
    { _id: id, status: 'active', 'progress.hintsUsed': used },
    { $inc: { 'progress.hintsUsed': 1 } },
    { new: true }
  )
  if (!updated) return sendError(res, 409, 'HINT_CONFLICT', 'Please try again.')

  const hint = found.hints[used]
  return res.json({
    hint: { id: hint.id, text: hint.text },
    hintsUsed: updated.progress.hintsUsed,
    hintsRemaining: updated.hints.length - updated.progress.hintsUsed,
    scorePreview: computeScore({
      difficulty: updated.difficulty,
      discoveredCount: updated.progress.discoveredClueIds.length,
      hintsUsed: updated.progress.hintsUsed,
      correct: true,
    }).total,
  })
})

// POST /api/cases/:id/accuse
router.post('/:id/accuse', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, 'INVALID_ID', 'Invalid case id.')

  const parsed = accuseSchema.safeParse(req.body ?? {})
  if (!parsed.success) return sendError(res, 400, 'INVALID_SUSPECT', 'Please select a suspect.')
  const { suspectId } = parsed.data

  const found = await Case.findById(id)
  if (!found) return sendError(res, 404, 'CASE_NOT_FOUND', 'This case does not exist.')
  if (found.status === 'completed') return sendError(res, 409, 'ALREADY_ACCUSED', 'This case is already solved.')

  if (!found.suspects.some((s) => s.id === suspectId)) {
    return sendError(res, 400, 'INVALID_SUSPECT', 'That suspect is not part of this case.')
  }

  const correct = suspectId === found.solution.culpritId
  const score = computeScore({
    difficulty: found.difficulty,
    discoveredCount: found.progress.discoveredClueIds.length,
    hintsUsed: found.progress.hintsUsed,
    correct,
  })

  const updated = await Case.findOneAndUpdate(
    { _id: id, status: 'active' },
    { status: 'completed', accusation: { suspectId, correct, submittedAt: new Date() }, score },
    { new: true }
  )
  if (!updated) return sendError(res, 409, 'ALREADY_ACCUSED', 'This case is already solved.')

  return res.json(buildResult(updated))
})

// GET /api/cases/:id/result
router.get('/:id/result', async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, 'INVALID_ID', 'Invalid case id.')

  const found = await Case.findById(id)
  if (!found) return sendError(res, 404, 'CASE_NOT_FOUND', 'This case does not exist.')
  if (found.status !== 'completed') {
    return sendError(res, 403, 'CASE_NOT_COMPLETED', 'Submit an accusation to see the result.')
  }

  return res.json(buildResult(found))
})

export default router