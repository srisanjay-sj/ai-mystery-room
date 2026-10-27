import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Create from './pages/Create'
import Investigation from './pages/Investigation'
import Accuse from './pages/Accuse'
import Result from './pages/Result'

const Placeholder = ({ name }) => (
  <p className="p-8 text-center text-neutral-400">{name} page coming soon</p>
)

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-ink text-neutral-100">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-800 bg-ink/80 px-4 py-3 backdrop-blur">
          <Link to="/" className="font-display text-xl font-bold uppercase tracking-widest">
            <span className="text-blood">●</span> Mystery Room
          </Link>
          <Link
            to="/create"
            className="border border-blood px-4 py-1.5 font-display text-sm font-bold uppercase tracking-wider text-blood transition hover:bg-blood hover:text-white"
          >
            New Mystery
          </Link>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/case/:id" element={<Investigation />} />
          <Route path="/case/:id/accuse" element={<Accuse />} />
          <Route path="/case/:id/result" element={<Result />} />
          <Route path="*" element={<Placeholder name="Not found" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}