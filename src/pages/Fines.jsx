import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { CheckCircle, Book, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZE = 8

export default function Fines() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fines, setFines] = useState([])
  const [filter, setFilter] = useState('unpaid')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [payConfirm, setPayConfirm] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const toast = useToast()

  useEffect(() => { loadFines(1) }, [])

  const loadFines = async (p = 1, opts) => {
    const f = opts?.filter ?? filter
    const s = opts?.search ?? search
    setPage(p)
    setLoading(true)
    let query = supabase
      .from('fines')
      .select('*, borrows!inner(borrow_date, due_date, books(title)), members!inner(name, email)', { count: 'exact' })
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false })

    if (f === 'paid') query = query.eq('paid', true)
    else if (f === 'unpaid') query = query.eq('paid', false)

    if (s) {
      query = query.ilike('members.name', `%${s}%`)
    }

    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count } = await query.range(from, to)
    setFines(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const handleFilterChange = (val) => {
    setFilter(val)
    loadFines(1, { filter: val })
  }

  const handleSearchChange = (val) => {
    setSearch(val)
    loadFines(1, { search: val })
  }

  const handlePay = async (id) => {
    await supabase.from('fines').update({ paid: true, paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    toast.success('Fine marked as paid')
    loadFines(page)
  }

  const totalUnpaid = fines.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="page-header">
        <h1>Fines</h1>
      </div>
      <div className="stats-grid">
        <div className={`stat-card${loading ? ' skeleton' : ''}`}>
          <div className="stat-card-left">
            <div className="stat-icon-circle" style={{ background: '#dc262615', color: '#dc2626' }}>
              <span style={{ fontSize: 22, fontWeight: 700 }}>₹</span>
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Unpaid Fines</p>
              <h3 className="stat-value">₹{totalUnpaid.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="filter-bar">
        <input placeholder="Search by member or book..." value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        <select value={filter} onChange={(e) => handleFilterChange(e.target.value)}>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <div className="list-cards">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="list-card" style={{ pointerEvents: 'none' }}>
              <div className="skeleton-circle" style={{ width: 44, height: 44 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-bar" style={{ width: '70%', marginBottom: 6 }} />
                <div className="skeleton-bar" style={{ width: '40%', height: 10 }} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="skeleton-bar" style={{ width: 50, height: 20, marginBottom: 4 }} />
                <div className="skeleton-badge" />
              </div>
            </div>
          ))}
        </div>
      ) : fines.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: 48, fontWeight: 300, color: 'var(--text-muted)' }}>₹</span>
          <h3>No fines found</h3>
          <p>Fines will appear here when books are returned late.</p>
        </div>
      ) : (
        <>
          <div className="list-cards">
            {fines.map((f) => (
              <div key={f.id} className="list-card" onClick={() => navigate(`/app/fines/${f.id}`)}>
                <div className="list-card-avatar" style={{ background: f.paid ? '#059669' : '#dc2626' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>₹</span>
                </div>
                <div className="list-card-info">
                  <p className="list-card-title">{f.members?.name}</p>
                  <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Book size={11} /> {f.borrows?.books?.title}
                  </p>
                  <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> Due: {new Date(f.borrows?.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="list-card-meta">
                  <span className="list-card-amount" style={{ color: f.paid ? '#059669' : '#dc2626' }}>
                    ₹{parseFloat(f.amount).toFixed(2)}
                  </span>
                  <span className={`badge ${f.paid ? 'badge-success' : 'badge-danger'}`}>
                    {f.paid ? 'Paid' : 'Unpaid'}
                  </span>
                  {!f.paid && (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ marginTop: 4 }}
                      onClick={(e) => { e.stopPropagation(); setPayConfirm(f) }}
                    >
                      <CheckCircle size={12} /> Pay
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => loadFines(page - 1)}><ChevronLeft size={16} /> Prev</button>
              <span className="pagination-info">Page {page} of {totalPages} ({total} fines)</span>
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => loadFines(page + 1)}>Next <ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!payConfirm}
        onClose={() => setPayConfirm(null)}
        onConfirm={() => { handlePay(payConfirm.id); setPayConfirm(null) }}
        title="Mark Fine as Paid"
        message={payConfirm ? `Mark ₹${parseFloat(payConfirm.amount).toFixed(2)} fine for "${payConfirm.members?.name}" as paid?` : ''}
        confirmText="Yes, Mark Paid"
        cancelText="Cancel"
      />
    </div>
  )
}
