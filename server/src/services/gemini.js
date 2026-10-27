import { GoogleGenAI } from '@google/genai'
import { DIFFICULTY_CONFIG, parseAIJson, validateMystery } from '../validators/mystery.js'

let client
function getClient() {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  return client
}

function buildPrompt(premise, difficulty, previousError) {
  const cfg = DIFFICULTY_CONFIG[difficulty]
  return `Create a fictional, non-graphic detective mystery.

Premise: "${premise}"
Difficulty: ${difficulty}

Rules:
- Exactly ${cfg.suspects} suspects (ids s1..s${cfg.suspects}), exactly ${cfg.clues} clues (ids c1..c${cfg.clues}), exactly ${cfg.hints} hints (ids h1..h${cfg.hints}).
- Exactly one suspect is the culprit. The solution must be logically deducible from the clues: the culprit has motive and opportunity, and the clues together contradict the culprit's alibi.
- At least ${difficulty === 'easy' ? 2 : 3} clues must point to the culprit via "pointsTo".${difficulty !== 'easy' ? ' Also include at least 1 red herring clue that points to a non-culprit.' : ''}
- The story (150-300 words) sets the scene. It may mention suspects by name, but must NOT reveal or hint who the culprit is.
- Hints go from vague to specific and must NOT name the culprit.
- In "solution.explanation", mention at least 2 clue titles EXACTLY as written in the clues list.
- No real people, no graphic violence.

Return ONLY JSON in this shape:
{
  "title": "",
  "story": "",
  "suspects": [{ "id": "s1", "name": "", "role": "", "description": "", "alibi": "", "motive": "" }],
  "clues": [{ "id": "c1", "title": "", "location": "", "description": "", "pointsTo": ["s1"] }],
  "hints": [{ "id": "h1", "text": "" }],
  "solution": { "culpritId": "s1", "explanation": "" }
}
${previousError ? `\nYour previous attempt failed validation: ${previousError}\nFix these problems.` : ''}`
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateMystery(premise, difficulty, maxAttempts = 4) {
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await getClient().models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        contents: buildPrompt(premise, difficulty, lastError),
        config: { responseMimeType: 'application/json', temperature: 0.9 },
      })
      const raw = parseAIJson(response.text)
      return validateMystery(raw, difficulty)
    } catch (err) {
      console.error(`Gemini attempt ${attempt} failed:`, err.message)

      const overloaded = /503|UNAVAILABLE|429/.test(err.message)
      if (overloaded) {
        await sleep(attempt * 3000) // wait 3s, 6s, 9s...
      } else {
        lastError = err.message // only validation errors go back into the prompt
      }
    }
  }

  const error = new Error('AI generation failed after retries')
  error.code = 'AI_GENERATION_FAILED'
  throw error
}