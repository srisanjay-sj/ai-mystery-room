import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { errorMessage, getResult } from '../api'

function ScoreCounter({ target }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / 1400, 1)
      setValue(Math.round(target * t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return <>{value}</>
}

export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getResult(id)
      .then(setResult)
      .catch((err) => {
        if (err.response?.status === 403) navigate(`/case/${id}`, { replace: true })
        else setError(errorMessage(err))
      })
  }, [id, navigate])

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="border border-blood/60 bg-blood/10 p-4 text-red-300">{error}</p>
        <Link to="/" className="mt-6 inline-block text-blood hover:underline">← Back to Home</Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-800 border-t-blood" />
      </div>
    )
  }

  const { correct, accused, culprit, explanation, keyClues, score } = result

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12">
      <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.3em] text-blood">Case Closed</p>
      <h1
        className={`animate-fade-up mt-3 font-display text-5xl font-bold uppercase italic sm:text-7xl ${
          correct ? 'text-emerald-400' : 'text-blood animate-flicker'
        }`}
        style={{ animationDelay: '0.1s' }}
      >
        {correct ? 'Case Solved!' : 'Wrong Accusation'}
      </h1>
      <p className="animate-fade-up mt-3 text-neutral-400" style={{ animationDelay: '0.2s' }}>
        {correct
          ? `You correctly accused ${culprit.name}.`
          : `You accused ${accused.name}, but the real culprit was ${culprit.name}.`}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="animate-fade-up border border-blood bg-blood/10 p-6" style={{ animationDelay: '0.3s' }}>
          <div className="text-xs uppercase tracking-widest text-blood">The Culprit</div>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase">{culprit.name}</h2>
          <p className="text-xs uppercase tracking-widest text-neutral-400">{culprit.role}</p>
          <p className="mt-3 text-sm text-neutral-300">{culprit.motive}</p>
        </div>

        <div className="animate-fade-up border border-neutral-800 bg-panel p-6" style={{ animationDelay: '0.4s' }}>
          <div className="text-xs uppercase tracking-widest text-neutral-400">Your Score</div>
          <div className="mt-1 font-display text-6xl font-bold text-blood">
            <ScoreCounter target={score.total} />
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-neutral-300">
              <dt>Correct accusation</dt><dd>+{score.base}</dd>
            </div>
            <div className="flex justify-between text-neutral-300">
              <dt>Clues discovered</dt><dd>+{score.clueBonus}</dd>
            </div>
            <div className="flex justify-between text-neutral-300">
              <dt>Hints used</dt><dd>−{score.hintPenalty}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="animate-fade-up mt-10" style={{ animationDelay: '0.5s' }}>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
          What <span className="italic text-blood">really</span> happened
        </h2>
        <p className="mt-3 border-l-2 border-blood pl-4 leading-relaxed text-neutral-300">{explanation}</p>
      </section>

      {keyClues.length > 0 && (
        <section className="animate-fade-up mt-10" style={{ animationDelay: '0.6s' }}>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
            Key <span className="italic text-blood">evidence</span>
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {keyClues.map((c) => (
              <div key={c.id} className="border border-neutral-800 bg-panel p-5">
                <h3 className="font-display text-lg font-bold uppercase">{c.title}</h3>
                <p className="text-xs uppercase tracking-widest text-neutral-500">📍 {c.location}</p>
                <p className="mt-2 text-sm text-neutral-300">{c.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 text-center">
        <Link
          to="/create"
          className="animate-pulse-glow inline-block bg-blood px-10 py-4 font-display text-xl font-bold uppercase tracking-widest transition hover:bg-red-500"
        >
          Solve Another Mystery
        </Link>
      </div>
    </div>
  )
}