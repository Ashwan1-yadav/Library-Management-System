import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Search, ChevronLeft, ChevronRight, Users, Mail, Phone, Calendar, ChevronRight as ChevronRightIcon } from 'lucide-react'
import Fab from '../components/Fab'

const PAGE_SIZE = 8

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export default function Members() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const location = useLocation()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { loadMembers(1) }, [location.pathname])

  const loadMembers = async (p) => {
    setLoading(true)
    setPage(p)
    let query = supabase.from('members').select('*', { count: 'exact' }).eq('admin_id', user.id).order('name')
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count } = await query.range(from, to)
    setMembers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const avatarColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

  return (
    <div>
      <div className="page-header">
        <h1>Members</h1>
        <Link to="/app/members/new" className="btn btn-primary hide-mobile"><Plus size={16} /> Add Member</Link>
      </div>
      <div className="search-bar">
        <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadMembers(1)} />
        <button className="btn btn-primary search-btn-round" onClick={() => loadMembers(1)}><Search size={18} /></button>
      </div>

      {loading ? (
        <div className="members-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="list-card skeleton" style={{ pointerEvents: 'none' }}>
              <div className="skeleton-circle" style={{ width: 44, height: 44 }} />
              <div className="skeleton-body">
                <div className="skeleton-text" />
                <div className="skeleton-text short" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No members found</h3>
          <p>Try a different search or add a new member.</p>
        </div>
      ) : (
        <div className="members-grid">
          {members.map((m, i) => (
            <div key={m.id} className="list-card" onClick={() => navigate(`/app/members/${m.id}`)}>
              <div className="list-card-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                {m.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="list-card-info">
                <p className="list-card-title">{m.name}</p>
                <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={11} /> {m.email}
                </p>
                {m.phone && (
                  <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={11} /> {m.phone}
                  </p>
                )}
              </div>
              <div className="list-card-meta">
                <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> {new Date(m.membership_date).toLocaleDateString()}
                </p>
                {isMobile && <ChevronRightIcon size={14} style={{ color: 'var(--text-light)', marginTop: 4 }} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" disabled={page <= 1} onClick={() => loadMembers(page - 1)}><ChevronLeft size={16} /> Prev</button>
          <span className="pagination-info">Page {page} of {totalPages} ({total} members)</span>
          <button className="pagination-btn" disabled={page >= totalPages} onClick={() => loadMembers(page + 1)}>Next <ChevronRight size={16} /></button>
        </div>
      )}
      <Fab onClick={() => navigate('/app/members/new')} />
    </div>
  )
}
