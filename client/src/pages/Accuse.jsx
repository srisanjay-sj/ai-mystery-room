import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { accuse, errorMessage, getCase } from '../api'

export default function Accuse() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCase(id)
      .then((c) => {
        if (c.status === 'completed') navigate(`/case/${id}/result`, { replace: true })
        else setData(c)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleSubmit() {
    if (!selected || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await accuse(id, selected)
      navigate(`/case/${id}/result`)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-800 border-t-blood" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="border border-blood/60 bg-blood/10 p-4 text-red-300">{error}</p>
        <Link to="/" className="mt-6 inline-block text-blood hover:underline">← Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link to={`/case/${id}`} className="text-sm text-neutral-400 hover:text-blood">← Back to investigation</Link>

      <p className="animate-fade-up mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-blood">Final Decision</p>
      <h1 className="animate-fade-up mt-3 font-display text-4xl font-bold uppercase sm:text-5xl" style={{ animationDelay: '0.1s' }}>
        Who is the <span className="italic text-blood">culprit?</span>
      </h1>
      <p className="animate-fade-up mt-3 text-neutral-400" style={{ animationDelay: '0.2s' }}>
        You've found {data.progress.cluesFound} of {data.progress.cluesTotal} clues. This accusation is final.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.suspects.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`animate-fade-up border p-5 text-left transition hover:-translate-y-1 ${
              selected === s.id
                ? 'border-blood bg-blood/10 shadow-[0_0_30px_rgba(225,29,46,0.25)]'
                : 'border-neutral-800 bg-panel hover:border-neutral-600'
            }`}
            style={{ animationDelay: `${0.25 + i * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold uppercase">{s.name}</h3>
              {selected === s.id && <span className="text-xs font-semibold uppercase text-blood">Selected</span>}
            </div>
            <p className="text-xs uppercase tracking-widest text-blood">{s.role}</p>
            <p className="mt-3 text-sm text-neutral-400">{s.description}</p>
          </button>
        ))}
      </div>

      {error && <div className="mt-6 border border-blood/60 bg-blood/10 p-3 text-sm text-red-300">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className="mt-10 w-full bg-blood px-10 py-4 font-display text-xl font-bold uppercase tracking-widest transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {submitting ? 'Submitting...' : 'Confirm Accusation'}
      </button>
    </div>
  )
}