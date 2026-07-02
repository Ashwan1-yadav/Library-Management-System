import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Book, Users, ArrowLeftRight, IndianRupee, TrendingUp, Plus, Eye, BookOpen, UserPlus } from 'lucide-react'

function useAnimatedNumber(target, duration = 1200, enabled = true) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (!enabled || target === 0) { setDisplay(target); return }
    let start = null
    const from = 0
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration, enabled])

  return display
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ books: 0, members: 0, borrows: 0, fines: 0 })
  const [recentBorrows, setRecentBorrows] = useState([])
  const [borrowsLoading, setBorrowsLoading] = useState(true)

  const animatedBooks = useAnimatedNumber(stats.books, 1200, !loading)
  const animatedMembers = useAnimatedNumber(stats.members, 1200, !loading)
  const animatedBorrows = useAnimatedNumber(stats.borrows, 1200, !loading)
  const animatedFines = useAnimatedNumber(stats.fines, 1200, !loading)

  useEffect(() => {
    loadStats()
    loadRecentBorrows()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    const { count: books } = await supabase.from('books').select('*', { count: 'exact', head: true }).eq('admin_id', user.id)
    const { count: members } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('admin_id', user.id)
    const { count: borrows } = await supabase.from('borrows').select('*', { count: 'exact', head: true }).eq('status', 'borrowed').eq('admin_id', user.id)
    const { count: fines } = await supabase.from('fines').select('*', { count: 'exact', head: true }).eq('paid', false).eq('admin_id', user.id)
    setStats({ books: books || 0, members: members || 0, borrows: borrows || 0, fines: fines || 0 })
    setLoading(false)
  }

  const loadRecentBorrows = async () => {
    setBorrowsLoading(true)
    const { data } = await supabase
      .from('borrows')
      .select('*, books(title, cover_image), members(name)')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false })
    setRecentBorrows(data || [])
    setBorrowsLoading(false)
  }

  const statCards = [
    { icon: BookOpen, label: 'Total Books', value: animatedBooks, color: '#2563eb', change: '+12%' },
    { icon: Users, label: 'Members', value: animatedMembers, color: '#059669', change: '+8%' },
    { icon: ArrowLeftRight, label: 'Active Borrows', value: animatedBorrows, color: '#d97706', change: '-3%' },
    { icon: IndianRupee, label: 'Unpaid Fines', value: animatedFines, color: '#dc2626', change: '+5%' },
  ]

  const quickActions = [
    { to: '/app/books/new', icon: Plus, label: 'Add Book', color: '#2563eb' },
    { to: '/app/members/new', icon: UserPlus, label: 'Add Member', color: '#059669' },
    { to: '/app/borrow-return', icon: ArrowLeftRight, label: 'New Borrow', color: '#d97706' },
    { to: '/app/reports', icon: TrendingUp, label: 'Reports', color: '#7c3aed' },
  ]

  return (
    <div className="dashboard-root">
      <div className="dashboard-welcome">
        <h1>Welcome back, {user?.email?.split('@')[0] || 'Admin'}</h1>
        <p>Here's what's happening at your library today.</p>
      </div>

      <div className="stats-grid">
        {statCards.map(({ icon: Icon, label, value, color, change }) => (
          <div className={`stat-card${loading ? ' skeleton' : ''}`} key={label}>
            <div className="stat-card-left">
              <div className="stat-icon-circle" style={{ background: `${color}15`, color }}>
                <Icon size={22} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{label}</p>
                <h3 className="stat-value">{value}</h3>
          </div>
        </div>
            <div className="stat-change" style={{ color: change.startsWith('+') ? '#059669' : '#dc2626' }}>
              <TrendingUp size={14} />
              <span>{change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card quick-actions-card-standalone">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map(({ to, icon: Icon, label, color }) => (
              <Link to={to} key={label} className="quick-action-card">
                <div className="quick-action-icon" style={{ background: `${color}15`, color }}>
                  <Icon size={20} />
                </div>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Recent Borrows</h2>
            <Link to="/app/borrow-return" className="btn btn-ghost btn-sm"><Eye size={14} /> View All</Link>
          </div>
          <div className="recent-borrows">
            {borrowsLoading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} className="skeleton-borrow-item">
                  <div className="skeleton-circle skeleton-borrow-cover" />
                  <div className="skeleton-borrow-info">
                    <div className="skeleton-bar" style={{ width: '70%', marginBottom: 6 }} />
                    <div className="skeleton-bar" style={{ width: '40%', height: 10 }} />
                  </div>
                  <div className="skeleton-badge" />
                </div>
              ))
            ) : recentBorrows.length === 0 ? (
              <p className="empty-text">No recent borrows</p>
            ) : (
              recentBorrows.slice(0, 5).map((b) => (
                <div key={b.id} className="borrow-item" onClick={() => navigate(`/app/borrows/${b.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="borrow-item-cover">
                    {b.books?.cover_image ? (
                      <img src={b.books.cover_image} alt="" />
                    ) : (
                      <Book size={16} />
                    )}
                  </div>
                  <div className="borrow-item-info">
                    <span className="borrow-item-book">{b.books?.title}</span>
                    <span className="borrow-item-member">by {b.members?.name}</span>
                  </div>
                  <span className={`badge ${b.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`}>
                    {b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
