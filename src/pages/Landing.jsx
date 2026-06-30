import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Library, Book, Users, ArrowLeftRight, DollarSign, BarChart3, Shield, ChevronRight, Sun, Moon, Sparkles, LogIn, UserPlus } from 'lucide-react'
import { useState, useEffect } from 'react'

const features = [
  { icon: Book, title: 'Book Management', desc: 'Add, edit, and organize your entire book catalog with cover images, genres, and availability tracking.' },
  { icon: Users, title: 'Member Directory', desc: 'Maintain a complete member database with contact details, membership dates, and borrowing history.' },
  { icon: ArrowLeftRight, title: 'Borrow & Return', desc: 'Streamlined check-out and check-in with automatic due-date tracking and real-time availability updates.' },
  { icon: DollarSign, title: 'Fine Management', desc: 'Auto-calculate late fees (₹10/day), track payments, and get notified when fines exceed thresholds.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Visual insights with genre distribution, monthly borrowing trends, and top-circulated books.' },
  { icon: Shield, title: 'Secure Admin Access', desc: 'Role-based authentication with Supabase, ensuring only authorized staff can manage the system.' },
]

const steps = [
  { num: '01', title: 'Add Your Collection', desc: 'Import or manually add books with cover images, ISBNs, genres, and stock quantities.' },
  { num: '02', title: 'Register Members', desc: 'Onboard library members with their contact info and track their borrowing activity.' },
  { num: '03', title: 'Start Lending', desc: 'Issue books, set due dates, and let the system handle returns, fines, and availability automatically.' },
]

export default function Landing() {
  const { user } = useAuth()
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <div className="landing">
      <div className="landing-illustrations">
        <div className="landing-blob blob-1" />
        <div className="landing-blob blob-2" />
        <div className="landing-blob blob-3" />
        <div className="landing-grid-bg" />
        <div className="landing-float float-1"><div className="float-shape shape-1" /></div>
        <div className="landing-float float-2"><div className="float-shape shape-2" /></div>
        <div className="landing-float float-3"><div className="float-shape shape-3" /></div>
        <div className="landing-float float-4"><div className="float-shape shape-4" /></div>
        <div className="landing-float float-5"><div className="float-shape shape-5" /></div>
      </div>

      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon"><Library size={22} /></div>
            <span className="landing-logo-text">LibraSys</span>
          </div>
          <div className="landing-nav-right">
            <button className="landing-icon-btn" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {user ? (
              <Link to="/app" className="btn btn-primary">Dashboard <ChevronRight size={16} /></Link>
            ) : (
              <>
                <Link to="/login" state={{ signUp: true }} className="btn btn-ghost"><UserPlus size={16} /> Register</Link>
                <Link to="/login" className="btn btn-primary"><LogIn size={16} /> Login as Admin</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge"><Sparkles size={14} /> Library Management System</div>
          <h1 className="landing-hero-title">
            Manage Your Library<br />
            <span className="landing-hero-gradient">with Modern Simplicity</span>
          </h1>
          <p className="landing-hero-sub">
            A full-featured, cloud-powered library management platform. Track books, manage members,
            handle borrowings and returns, calculate fines, and gain insights — all from one dashboard.
          </p>
          <div className="landing-hero-actions">
            {user ? (
              <Link to="/app" className="btn btn-primary btn-lg">Go to Dashboard <ChevronRight size={18} /></Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-lg"><LogIn size={18} /> Login as Admin</Link>
                <Link to="/login" state={{ signUp: true }} className="btn btn-secondary btn-lg"><UserPlus size={18} /> Register</Link>
                <a href="#features" className="btn btn-ghost btn-lg">Explore Features</a>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-tag">Features</span>
            <h2>Everything You Need to Run a Library</h2>
            <p>Powerful tools designed for modern library management, from cataloging to analytics.</p>
          </div>
          <div className="landing-features">
            {features.map(({ icon: Icon, title, desc }) => (
              <div className="landing-feature-card" key={title}>
                <div className="landing-feature-icon"><Icon size={24} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-tag">How It Works</span>
            <h2>Get Started in 3 Simple Steps</h2>
            <p>From setup to daily operations, LibraSys makes library management effortless.</p>
          </div>
          <div className="landing-steps">
            {steps.map(({ num, title, desc }) => (
              <div className="landing-step" key={num}>
                <div className="landing-step-number">{num}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-cta-card">
            <h2>Ready to Modernize Your Library?</h2>
            <p>Get started with LibraSys today and transform how you manage your collection, members, and operations.</p>
            {user ? (
              <Link to="/app" className="btn btn-primary btn-lg">Go to Dashboard <ChevronRight size={18} /></Link>
            ) : (
              <div className="landing-hero-actions">
                <Link to="/login" className="btn btn-primary btn-lg"><LogIn size={18} /> Login as Admin</Link>
                <Link to="/login" state={{ signUp: true }} className="btn btn-secondary btn-lg"><UserPlus size={18} /> Register</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon"><Library size={18} /></div>
              <span className="landing-logo-text">LibraSys</span>
            </div>
            <p>Modern library management, powered by React & Supabase.</p>
          </div>
          <div className="landing-footer-copy">
            &copy; {new Date().getFullYear()} LibraSys. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
