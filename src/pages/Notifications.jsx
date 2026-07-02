import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { Book, User, Calendar, IndianRupee, ChevronLeft, ChevronRight, Bell, CheckCircle } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const isMobile = useIsMobile()
  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [payConfirm, setPayConfirm] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const PAGE_SIZE = 10

  useEffect(() => { loadFines(1) }, [])

  const loadFines = async (p) => {
    setLoading(true)
    setPage(p)
    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count } = await supabase
      .from('fines')
      .select('*, borrows(borrow_date, due_date, books(title)), members(name, email)', { count: 'exact' })
      .eq('admin_id', user.id)
      .eq('paid', false)
      .order('created_at', { ascending: false })
      .range(from, to)
    setFines(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const handlePay = async (id) => {
    await supabase.from('fines').update({ paid: true, paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    toast.success('Fine marked as paid')
    loadFines(page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const renderCard = (f) => (
    <div key={f.id} className={isMobile ? 'borrow-card-mobile' : 'list-card'} onClick={() => navigate(`/app/fines/${f.id}`)}>
      {isMobile ? (
        <>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dc262615', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IndianRupee size={18} style={{ color: '#dc2626' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {f.members?.name}
              </span>
              <span className="badge badge-danger" style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>Unpaid</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Book size={10} /> {f.borrows?.books?.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={10} /> Due: {f.borrows?.due_date ? new Date(f.borrows.due_date).toLocaleDateString() : 'N/A'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>₹{parseFloat(f.amount).toFixed(2)}</span>
            </div>
          </div>
          <button className="btn btn-success btn-sm" style={{ fontSize: 11, padding: '4px 10px', minHeight: 0, borderRadius: 8, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); setPayConfirm(f) }}>
            <CheckCircle size={10} /> Pay
          </button>
        </>
      ) : (
        <>
          <div className="list-card-avatar" style={{ background: '#dc2626' }}>
            <IndianRupee size={18} style={{ color: '#fff' }} />
          </div>
          <div className="list-card-info">
            <p className="list-card-title">{f.members?.name}</p>
            <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Book size={11} /> {f.borrows?.books?.title}
            </p>
            <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> Due: {f.borrows?.due_date ? new Date(f.borrows.due_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="list-card-meta">
            <span className="list-card-amount" style={{ color: '#dc2626' }}>₹{parseFloat(f.amount).toFixed(2)}</span>
            <span className="badge badge-danger">Unpaid</span>
            <button className="btn btn-success btn-sm" style={{ marginTop: 4 }} onClick={(e) => { e.stopPropagation(); setPayConfirm(f) }}>
              <CheckCircle size={12} /> Pay
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
      </div>
      {loading ? (
        <div className={isMobile ? 'borrow-cards-mobile' : 'list-cards'}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className={isMobile ? 'borrow-card-mobile' : 'list-card'} style={{ pointerEvents: 'none' }}>
              {isMobile ? (
                <>
                  <div className="skeleton-circle" style={{ width: 40, height: 40, borderRadius: 10 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-bar" style={{ width: '60%', marginBottom: 6 }} />
                    <div className="skeleton-bar" style={{ width: '80%', height: 10, marginBottom: 4 }} />
                    <div className="skeleton-bar" style={{ width: '40%', height: 10 }} />
                  </div>
                </>
              ) : (
                <>
                  <div className="skeleton-circle" style={{ width: 44, height: 44 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-bar" style={{ width: '60%', marginBottom: 6 }} />
                    <div className="skeleton-bar" style={{ width: '40%', height: 10 }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : fines.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>No notifications</h3>
          <p>All fines are cleared. You're up to date!</p>
        </div>
      ) : (
        <>
          <div className={isMobile ? 'borrow-cards-mobile' : 'list-cards'}>
            {fines.map(f => renderCard(f))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => loadFines(page - 1)}><ChevronLeft size={16} /> Prev</button>
              <span className="pagination-info">Page {page} of {totalPages} ({total} notifications)</span>
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
