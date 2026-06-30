import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Book, Users, ArrowLeftRight, DollarSign, TrendingUp, Plus, Eye, BookOpen, UserPlus } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ books: 0, members: 0, borrows: 0, fines: 0 })
  const [recentBorrows, setRecentBorrows] = useState([])

  useEffect(() => {
    loadStats()
    loadRecentBorrows()
  }, [])

  const loadStats = async () => {
    const { count: books } = await supabase.from('books').select('*', { count: 'exact', head: true })
    const { count: members } = await supabase.from('members').select('*', { count: 'exact', head: true })
    const { count: borrows } = await supabase.from('borrows').select('*', { count: 'exact', head: true }).eq('status', 'borrowed')
    const { count: fines } = await supabase.from('fines').select('*', { count: 'exact', head: true }).eq('paid', false)
    setStats({ books: books || 0, members: members || 0, borrows: borrows || 0, fines: fines || 0 })
  }

  const loadRecentBorrows = async () => {
    const { data } = await supabase
      .from('borrows')
      .select('*, books(title, cover_image), members(name)')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentBorrows(data || [])
  }

  const statCards = [
    { icon: BookOpen, label: 'Total Books', value: stats.books, color: '#2563eb', change: '+12%' },
    { icon: Users, label: 'Members', value: stats.members, color: '#059669', change: '+8%' },
    { icon: ArrowLeftRight, label: 'Active Borrows', value: stats.borrows, color: '#d97706', change: '-3%' },
    { icon: DollarSign, label: 'Unpaid Fines', value: `${stats.fines}`, color: '#dc2626', change: '+5%' },
  ]

  const quickActions = [
    { to: '/app/books/new', icon: Plus, label: 'Add Book', color: '#2563eb' },
    { to: '/app/members/new', icon: UserPlus, label: 'Add Member', color: '#059669' },
    { to: '/app/borrow-return', icon: ArrowLeftRight, label: 'New Borrow', color: '#d97706' },
    { to: '/app/reports', icon: TrendingUp, label: 'Reports', color: '#7c3aed' },
  ]

  return (
    <div>
      <div className="dashboard-welcome">
        <div>
          <h1>Welcome back, {user?.email?.split('@')[0] || 'Admin'}</h1>
          <p>Here's what's happening at your library today.</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(({ icon: Icon, label, value, color, change }) => (
          <div className="stat-card" key={label}>
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
        <div className="card">
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
            {recentBorrows.length === 0 ? (
              <p className="empty-text">No recent borrows</p>
            ) : (
              recentBorrows.map((b) => (
                <div key={b.id} className="borrow-item">
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
