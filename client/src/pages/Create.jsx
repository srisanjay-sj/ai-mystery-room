import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCase, errorMessage } from '../api'

const levels = [
  { id: 'easy', label: 'Easy', info: '3 suspects · 5 clues · 2 hints', pts: '100 pts' },
  { id: 'medium', label: 'Medium', info: '4 suspects · 7 clues · 3 hints', pts: '150 pts' },
  { id: 'hard', label: 'Hard', info: '5 suspects · 9 clues · 3 hints', pts: '200 pts' },
]

export default function Create() {
  const navigate = useNavigate()
  const [premise, setPremise] = useState('')
  const [difficulty, setDifficulty] = useState('easy')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const valid = premise.trim().length >= 10 && premise.trim().length <= 300

  async function handleGenerate() {
    if (!valid || loading) return
    setLoading(true)
    setError('')
    try {
      const created = await createCase(premise.trim(), difficulty)
      navigate(`/case/${created.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.3em] text-blood">New Case File</p>
      <h1
        className="animate-fade-up mt-3 font-display text-4xl font-bold uppercase sm:text-5xl"
        style={{ animationDelay: '0.1s' }}
      >
        Set the <span className="italic text-blood">scene</span>
      </h1>

      <div className="animate-fade-up mt-8" style={{ animationDelay: '0.2s' }}>
        <label className="font-display text-sm uppercase tracking-widest text-neutral-300">Mystery premise</label>
        <textarea
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          maxLength={300}
          rows={4}
          placeholder="e.g. A priceless painting vanishes during a midnight gala at a seaside hotel"
          className="mt-2 w-full border border-neutral-700 bg-panel p-4 text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-blood"
        />
        <div className="mt-1 text-right text-xs text-neutral-500">{premise.trim().length}/300 (min 10)</div>
      </div>

      <div className="animate-fade-up mt-6" style={{ animationDelay: '0.3s' }}>
        <label className="font-display text-sm uppercase tracking-widest text-neutral-300">Difficulty</label>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {levels.map((l) => (
            <button
              key={l.id}
              onClick={() => setDifficulty(l.id)}
              className={`border p-4 text-left transition hover:-translate-y-1 ${
                difficulty === l.id ? 'border-blood bg-blood/10' : 'border-neutral-800 bg-panel hover:border-neutral-600'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xl font-bold uppercase">{l.label}</span>
                <span className="text-xs text-blood">{l.pts}</span>
              </div>
              <p className="mt-2 text-xs text-neutral-400">{l.info}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 border border-blood/60 bg-blood/10 p-3 text-sm text-red-300">{error}</div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!valid || loading}
        className="mt-8 w-full bg-blood px-8 py-3 font-display text-lg font-bold uppercase tracking-wider transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
        Generate Mystery
      </button>

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/95">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-800 border-t-blood" />
          <p className="mt-6 font-display text-xl uppercase tracking-widest animate-flicker">
            Gemini is writing your case...
          </p>
          <p className="mt-2 text-sm text-neutral-500">This can take up to 20 seconds</p>
        </div>
      )}
    </div>
  )
}