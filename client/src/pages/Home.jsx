import { Link } from 'react-router-dom'

const steps = [
  { n: '01', title: 'Pick a premise', text: 'Describe any setting and choose your difficulty.' },
  { n: '02', title: 'Investigate', text: 'Read the story, study suspects, uncover clues.' },
  { n: '03', title: 'Accuse', text: 'Name the culprit and see your score.' },
]

const stats = ['3 Difficulty Levels', 'AI-Written Cases', 'Every Mystery Unique']

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-57px)] overflow-hidden">
      <div className="bg-spotlight pointer-events-none absolute inset-0" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="scanline" />

      <section className="relative mx-auto max-w-5xl px-4 pb-16 pt-16 sm:pt-24">
        <p className="animate-fade-up inline-block border border-blood/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blood">
          Case File #001 · Classified
        </p>

        <h1
          className="animate-fade-up mt-6 font-display text-5xl font-bold uppercase leading-[1.05] sm:text-7xl"
          style={{ animationDelay: '0.15s' }}
        >
          Every case has a culprit.
          <br />
          <span className="animate-flicker italic text-blood">Can you find them?</span>
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-xl text-lg text-neutral-300"
          style={{ animationDelay: '0.3s' }}
        >
          Gemini writes a brand-new whodunit just for you. Hunt for clues, use hints wisely, and make the final accusation.
        </p>

        <div className="animate-fade-up mt-10 flex flex-wrap gap-4" style={{ animationDelay: '0.45s' }}>
          <Link
            to="/create"
            className="animate-pulse-glow bg-blood px-8 py-3 font-display text-lg font-bold uppercase tracking-wider transition hover:bg-red-500"
          >
            Open a Case
          </Link>
          <a
            href="#how"
            className="border border-neutral-600 px-8 py-3 font-display text-lg font-bold uppercase tracking-wider text-neutral-200 transition hover:border-blood hover:text-blood"
          >
            How it works
          </a>
        </div>

        <div
          className="animate-fade-up mt-14 flex flex-wrap gap-x-8 gap-y-2 border-t border-neutral-800 pt-6 text-xs uppercase tracking-widest text-neutral-400"
          style={{ animationDelay: '0.6s' }}
        >
          {stats.map((s) => (
            <span key={s}>
              <span className="mr-2 text-blood">●</span>
              {s}
            </span>
          ))}
        </div>
      </section>

      <section id="how" className="relative mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className="animate-fade-up border border-neutral-800 bg-panel/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-blood"
            style={{ animationDelay: `${0.7 + i * 0.15}s` }}
          >
            <div className="font-display text-4xl font-bold text-blood">{s.n}</div>
            <h3 className="mt-3 font-display text-xl uppercase tracking-wide">{s.title}</h3>
            <p className="mt-2 text-sm text-neutral-400">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}