import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { discoverClue, errorMessage, getCase, requestHint } from '../api'

export default function Investigation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    getCase(id)
      .then((c) => {
        if (c.status === 'completed') navigate(`/case/${id}/result`, { replace: true })
        else setData(c)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleDiscover(clueId) {
    if (busy) return
    setBusy(clueId)
    setToast('')
    try {
      const res = await discoverClue(id, clueId)
      setData((prev) => ({
        ...prev,
        clues: prev.clues.map((c) =>
          c.id === clueId ? { ...c, discovered: true, description: res.clue.description } : c
        ),
        progress: res.progress,
        scorePreview: res.scorePreview,
      }))
    } catch (err) {
      setToast(errorMessage(err))
    } finally {
      setBusy('')
    }
  }

  async function handleHint() {
    if (busy) return
    setBusy('hint')
    setToast('')
    try {
      const res = await requestHint(id)
      setData((prev) => ({
        ...prev,
        hints: [...prev.hints, res.hint],
        hintsUsed: res.hintsUsed,
        scorePreview: res.scorePreview,
      }))
    } catch (err) {
      setToast(errorMessage(err))
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-800 border-t-blood" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="border border-blood/60 bg-blood/10 p-4 text-red-300">{error}</p>
        <Link to="/" className="mt-6 inline-block text-blood hover:underline">← Back to Home</Link>
      </div>
    )
  }

  const { progress } = data
  const pct = Math.round((progress.cluesFound / progress.cluesTotal) * 100)
  const hintsLeft = data.hintsTotal - data.hintsUsed

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="animate-fade-up flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="border border-blood/60 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-blood">
            {data.difficulty}
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase sm:text-5xl">{data.title}</h1>
        </div>
        <div className="border border-neutral-800 bg-panel px-5 py-3 text-right">
          <div className="text-xs uppercase tracking-widest text-neutral-400">Score if correct</div>
          <div className="font-display text-3xl font-bold text-blood">{data.scorePreview}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs uppercase tracking-widest text-neutral-400">
          <span>Clues found</span>
          <span>{progress.cluesFound}/{progress.cluesTotal}</span>
        </div>
        <div className="mt-2 h-2 bg-neutral-800">
          <div className="h-2 bg-blood transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">The <span className="italic text-blood">Story</span></h2>
        <p className="mt-3 whitespace-pre-line border-l-2 border-blood pl-4 leading-relaxed text-neutral-300">{data.story}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">The <span className="italic text-blood">Suspects</span></h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.suspects.map((s) => (
            <div key={s.id} className="border border-neutral-800 bg-panel p-5 transition hover:-translate-y-1 hover:border-blood">
              <h3 className="font-display text-xl font-bold uppercase">{s.name}</h3>
              <p className="text-xs uppercase tracking-widest text-blood">{s.role}</p>
              <p className="mt-3 text-sm text-neutral-300">{s.description}</p>
              <p className="mt-3 text-xs text-neutral-400"><span className="font-semibold text-neutral-200">Alibi: </span>{s.alibi}</p>
              <p className="mt-2 text-xs text-neutral-400"><span className="font-semibold text-neutral-200">Motive: </span>{s.motive}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">The <span className="italic text-blood">Evidence</span></h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {data.clues.map((c) => (
            <div
              key={c.id}
              className={`border p-5 transition ${c.discovered ? 'border-blood/70 bg-blood/5' : 'border-neutral-800 bg-panel'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase">{c.title}</h3>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">📍 {c.location}</p>
                </div>
                {c.discovered && <span className="text-xs font-semibold uppercase text-blood">Found</span>}
              </div>
              {c.discovered ? (
                <p className="animate-fade-up mt-3 text-sm text-neutral-300">{c.description}</p>
              ) : (
                <button
                  onClick={() => handleDiscover(c.id)}
                  disabled={!!busy}
                  className="mt-4 border border-blood px-4 py-1.5 font-display text-sm font-bold uppercase tracking-wider text-blood transition hover:bg-blood hover:text-white disabled:opacity-40"
                >
                  {busy === c.id ? 'Searching...' : 'Investigate'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 border border-neutral-800 bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Hints</h2>
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            {hintsLeft} left · −10 pts each
          </span>
        </div>
        {data.hints.length > 0 && (
          <ul className="mt-4 space-y-2">
            {data.hints.map((h, i) => (
              <li key={h.id} className="animate-fade-up border-l-2 border-blood pl-3 text-sm text-neutral-300">
                <span className="mr-2 font-display text-blood">#{i + 1}</span>{h.text}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={handleHint}
          disabled={!!busy || hintsLeft === 0}
          className="mt-4 border border-neutral-600 px-5 py-2 font-display text-sm font-bold uppercase tracking-wider transition hover:border-blood hover:text-blood disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === 'hint' ? 'Thinking...' : hintsLeft === 0 ? 'No hints left' : 'Request a hint'}
        </button>
      </section>

      {toast && <div className="mt-6 border border-blood/60 bg-blood/10 p-3 text-sm text-red-300">{toast}</div>}

      <div className="mt-12 text-center">
        <Link
          to={`/case/${id}/accuse`}
          className="animate-pulse-glow inline-block bg-blood px-10 py-4 font-display text-xl font-bold uppercase tracking-widest transition hover:bg-red-500"
        >
          Make an Accusation
        </Link>
      </div>
    </div>
  )
}