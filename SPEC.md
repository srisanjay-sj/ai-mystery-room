# SPEC.md — AI Mystery Room

## 1. Project Requirements

### 1.1 Overview and Problem Statement
AI Mystery Room is a web app where a player types a mystery premise, picks a difficulty, and Gemini generates a complete whodunit: story, suspects, clues, hints and a hidden solution. The player investigates by discovering clues, can ask for hints, then accuses one suspect. The backend scores the result and reveals the culprit and explanation.

Problem solved: most "AI story" apps are passive. This one is an interactive, fair, scored deduction game where the AI must produce a logically consistent, solvable case, and the solution stays hidden on the server until the player commits.

### 1.2 Target Users and Experience
- Casual players who like puzzle and detective games.
- Students and developers exploring AI-powered apps.
- Experience: type premise, wait a few seconds, read story, open clues one by one, use hints if stuck, accuse, see score.

### 1.3 Features
**Core**
- Generate a mystery from a premise at Easy / Medium / Hard.
- Investigation room with story, suspect cards, clue list, hint button, progress.
- Discover clues one at a time (description revealed on discovery).
- Request hints (sequential, limited per difficulty).
- Accuse a suspect, get verdict, culprit, explanation and score.
- Start a new mystery.

**Optional enhancements (only if time remains)**
- Resume an active case via saved case ID in the URL.
- Local "recent cases" list.
- Share result card.

### 1.4 Technology Stack
- Frontend: React (Vite), Tailwind CSS, react-router-dom, axios
- Backend: Node.js, Express, cors, dotenv
- Database: MongoDB Atlas with Mongoose
- AI: Gemini API via `@google/genai`
- Validation: zod
- Deployment: Frontend on Vercel, backend on Render (or similar), DB on MongoDB Atlas

### 1.5 Limitations
- No user accounts; a case is identified by its ID only.
- One accusation per case; no undo.
- Generation depends on Gemini availability and quota.
- English only.
- Content must be fictional and non-graphic (enforced in the Gemini prompt).

### 1.6 Final Deliverables
- Complete SPEC.md (this file)
- GitHub repository with source code and README (no secrets committed)
- Live website URL (Vercel frontend + deployed backend)
- A mystery created and solved on the live site

---

## 2. User Flow
1. User opens the website (Home).
2. User clicks Start, enters a premise and selects difficulty.
3. Frontend calls `POST /api/cases`; Gemini generates mystery, suspects, clues, hints.
4. User lands in the Investigation Room.
5. User discovers clues (each discovery calls the backend).
6. User requests hints if needed.
7. User opens Accusation, selects a suspect and submits.
8. Backend validates, scores, marks the case completed.
9. Results page shows verdict, culprit, explanation, score breakdown.
10. User can start another mystery.

---

## 3. UI and Page Specifications

Routes: `/`, `/create`, `/case/:id`, `/case/:id/accuse`, `/case/:id/result`

| Page | Purpose | Essential elements |
|---|---|---|
| Home `/` | Introduce the game | Title, one-line pitch, how-it-works (3 steps), Start button |
| Create Mystery `/create` | Collect input | Premise textarea (10-300 chars), difficulty selector (Easy/Medium/Hard with counts shown), Generate button |
| Investigation Room `/case/:id` | Main gameplay | Title, difficulty badge, story, suspect cards, clue list (locked/discovered), hint panel with hints used/available, progress (clues x/y), current score preview, Accuse button |
| Accusation `/case/:id/accuse` | Pick culprit | Selectable suspect cards, confirm button, warning that accusation is final |
| Results `/case/:id/result` | Show outcome | Correct/Incorrect verdict, culprit card, explanation, score breakdown, Play Again button |

**Loading states:** Generation shows a full-screen "Gemini is writing your case..." with spinner (can take 5-20s). Clue discover, hint and accuse buttons show inline loading and are disabled while pending.

**Error messages (user-friendly):**
- Generation failed: "Couldn't build the mystery. Please try again."
- Case not found: "This case doesn't exist." with Home link.
- Network or server error: toast with retry.
- Result requested before accusation: redirect to the investigation room.

**Navigation:** Header with logo (to Home) and "New Mystery" link. After accusation, the investigation room becomes read-only and redirects to Results.

**Responsive:** Mobile-first. Suspect and clue cards use a 1-column grid on mobile, 2 on tablet, 3 on desktop. Buttons at least 44px tall.

**Stitch AI mapping (optional):** Generate initial screens for the five pages above and map each screen to the page table.

---

## 4. Backend and Database Design

### 4.1 Environment Variables (server `.env`)
```
PORT=5000
MONGODB_URI=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
```

### 4.2 Database Model: `Case`
```
Case {
  _id: ObjectId
  title: String
  premise: String
  difficulty: "easy" | "medium" | "hard"
  story: String
  suspects: [{ id: "s1".., name, role, description, alibi, motive }]
  clues: [{ id: "c1".., title, location, description, pointsTo: [suspectId] }]   // pointsTo is PRIVATE
  hints: [{ id: "h1".., text }]                                                  // ordered, vague to specific
  solution: { culpritId: String, explanation: String }                          // PRIVATE
  progress: { discoveredClueIds: [String], hintsUsed: Number }
  status: "active" | "completed"
  accusation: { suspectId: String, correct: Boolean, submittedAt: Date }
  score: { base: Number, clueBonus: Number, hintPenalty: Number, total: Number }
  createdAt, updatedAt
}
```

### 4.3 Security Rule (critical)
`solution` and each clue's `pointsTo` are never sent to the client while `status = "active"`. All GET responses use a sanitizer that strips them. Undiscovered clues return only `id`, `title`, `location`, `discovered: false` (no description). Hints not yet requested are not sent.

### 4.4 API Endpoints

All responses are JSON. Errors: `{ "error": { "code": "STRING", "message": "Readable message" } }`.

**1. `POST /api/cases`** — generate a mystery
- Body: `{ "premise": string (10-300), "difficulty": "easy|medium|hard" }`
- 201: `{ "case": PublicCase }`
- 400 `VALIDATION_ERROR`, 502 `AI_GENERATION_FAILED`

**2. `GET /api/cases/:id`** — retrieve active case
- 200: `{ "case": PublicCase }`
- 400 `INVALID_ID`, 404 `CASE_NOT_FOUND`

**3. `POST /api/cases/:id/clues/:clueId/discover`**
- No body. Adds clueId to `discoveredClueIds` (idempotent, no double scoring).
- 200: `{ "clue": { id, title, location, description }, "progress": {...}, "scorePreview": number }`
- 404 `CASE_NOT_FOUND` / `CLUE_NOT_FOUND`, 409 `CASE_COMPLETED`

**4. `POST /api/cases/:id/hints`**
- No body. Returns the next hint in order and increments `hintsUsed`.
- 200: `{ "hint": { id, text }, "hintsUsed": n, "hintsRemaining": n, "scorePreview": number }`
- 409 `NO_HINTS_LEFT` / `CASE_COMPLETED`

**5. `POST /api/cases/:id/accuse`**
- Body: `{ "suspectId": string }`
- Validates suspectId exists and case is active; computes score; sets status completed.
- 200: `{ "correct": bool, "culprit": Suspect, "explanation": string, "score": {...} }`
- 400 `INVALID_SUSPECT`, 409 `ALREADY_ACCUSED`

**6. `GET /api/cases/:id/result`**
- 200: full result (verdict, accused suspect, culprit, explanation, key clues, score breakdown)
- 403 `CASE_NOT_COMPLETED` if still active

**Validation rules:** IDs must be valid ObjectIds; premise trimmed and length-checked; difficulty from allowed list; all request bodies parsed with zod.

**Error handling:** Central Express error middleware. Never leak stack traces or raw Gemini errors to the client. Log details server-side only. Unknown routes return 404 JSON. CORS limited to `CLIENT_URL`.

---

## 5. AI Behavior and Scoring Rules

### 5.1 Difficulty Configuration
| Difficulty | Suspects | Clues | Hints |
|---|---|---|---|
| Easy | 3 | 5 | 2 |
| Medium | 4 | 7 | 3 |
| Hard | 5 | 9 | 3 |

### 5.2 Gemini Output Format
Gemini must return **only JSON** (use structured output / `responseMimeType: "application/json"`), shaped as:
```json
{
  "title": "string",
  "story": "string (150-300 words, sets the scene, does NOT name the culprit)",
  "suspects": [{ "id": "s1", "name": "", "role": "", "description": "", "alibi": "", "motive": "" }],
  "clues": [{ "id": "c1", "title": "", "location": "", "description": "", "pointsTo": ["s1"] }],
  "hints": [{ "id": "h1", "text": "" }],
  "solution": { "culpritId": "s2", "explanation": "string" }
}
```

### 5.3 Validation Before Saving (zod + custom checks)
1. Parse JSON (strip code fences if present); fail on parse error.
2. Counts match the difficulty table exactly (suspects, clues, hints).
3. IDs unique and follow `s#`, `c#`, `h#`.
4. `solution.culpritId` matches exactly one suspect.
5. Every `pointsTo` id exists among suspects.
6. At least 3 clues point to the culprit (at least 2 on Easy), and at least 1 clue points to a non-culprit as a red herring on Medium/Hard.
7. Story and hints must not contain the culprit's name outright; the explanation must reference at least 2 clue titles.
8. Hints ordered from vague to specific.

If validation fails, retry generation up to 2 more times with the failure reason appended to the prompt. After 3 failures return 502 `AI_GENERATION_FAILED` and save nothing.

### 5.4 Logical Consistency Requirement
The solution must be deducible from the clues: the culprit has motive and opportunity, and the clues together contradict the culprit's alibi. The prompt must state this explicitly. Content must be fictional, non-graphic, with no real people.

### 5.5 Scoring Rules (backend only)
- Base points for correct accusation: Easy 100, Medium 150, Hard 200
- Each discovered clue: +5
- Each hint used: -10
- Minimum score: 0

```
base       = correct ? {easy:100, medium:150, hard:200}[difficulty] : 0
clueBonus  = 5 * discoveredClueIds.length
hintPenalty= 10 * hintsUsed
total      = max(0, base + clueBonus - hintPenalty)
```
A wrong accusation gets base 0, so the total is only clue bonus minus hint penalty, floored at 0. The client never sends a score; `scorePreview` shown during play is computed server-side assuming a correct accusation.

---

## 6. Acceptance Criteria
- [ ] Mysteries can be generated at Easy, Medium and Hard with the exact suspect/clue/hint counts.
- [ ] Invalid or malformed Gemini output is retried or fails safely with no crash and no bad data saved.
- [ ] Player can discover clues, request hints (up to the limit) and submit an accusation.
- [ ] `GET /api/cases/:id` never contains `solution` or `pointsTo` while the case is active.
- [ ] `GET /api/cases/:id/result` returns 403 before an accusation.
- [ ] Scores are calculated on the backend per section 5.5 and the minimum is 0.
- [ ] Re-discovering a clue or re-accusing does not change the score.
- [ ] Results page shows the correct culprit, explanation and score breakdown.
- [ ] Loading and error states exist on every API-driven action.
- [ ] Layout works on mobile and desktop.
- [ ] No secrets in the repo; `.env` is git-ignored.
- [ ] Deployed frontend and backend work end to end on the live URL (CORS and env vars configured).
- [ ] A full mystery has been created and solved on the production site.

---

## 7. Suggested Project Structure
```
/client   (Vite + React + Tailwind)
  src/pages, src/components, src/api, src/App.jsx
/server
  src/config, src/models/Case.js, src/routes/cases.js,
  src/controllers, src/services/gemini.js, src/services/scoring.js,
  src/validators, src/middleware/errorHandler.js, src/index.js
SPEC.md
README.md
```
