import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Undo2, Book, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'
import Fab from '../components/Fab'
import ConfirmDialog from '../components/ConfirmDialog'

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

export default function BorrowReturn() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [borrows, setBorrows] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [returnConfirm, setReturnConfirm] = useState(null)
  const [page, setPage] = useState(1)
  const toast = useToast()

  useEffect(() => {
    loadBorrows()
  }, [])

  const loadBorrows = async (opts) => {
    const s = opts?.search ?? search
    const f = opts?.filter ?? filter
    setPage(1)
    setLoading(true)

    let query = supabase
      .from('borrows')
      .select('*, books(title, author, cover_image), members(name, email)')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false })

    if (f === 'borrowed') query = query.eq('status', 'borrowed')
    else if (f === 'returned') query = query.eq('status', 'returned')

    const { data } = await query
    let result = data || []

    const q = s.toLowerCase()
    if (q) {
      result = result.filter(
        (b) => b.books?.title?.toLowerCase().includes(q) || b.members?.name?.toLowerCase().includes(q)
      )
    }

    setBorrows(result)
    setLoading(false)
  }

  const handleReturn = async (borrow) => {
    const { error: err } = await supabase
      .from('borrows')
      .update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] })
      .eq('id', borrow.id)

    if (!err) {
      const { data: book } = await supabase.from('books').select('available_quantity, quantity').eq('id', borrow.book_id).single()
      if (book && book.available_quantity < book.quantity) {
        await supabase.from('books').update({ available_quantity: book.available_quantity + 1 }).eq('id', borrow.book_id)
      }
      const dueDate = new Date(borrow.due_date)
      const returnDate = new Date()
      if (returnDate > dueDate) {
        const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24))
        const fineAmount = daysLate * 10
        await supabase.from('fines').insert({
          borrow_id: borrow.id,
          member_id: borrow.member_id,
          amount: fineAmount,
        })
        if (daysLate > 0) {
          toast.info(`Late return: ₹${fineAmount} fine applied (${daysLate} days)`)
        }
      }
      toast.success('Book returned successfully')
      loadBorrows()
    }
  }

  const renderCard = (b) => (
    <div key={b.id} className={isMobile ? 'borrow-card-mobile' : 'list-card'} onClick={() => navigate(`/app/borrows/${b.id}`)}>
      {b.books?.cover_image ? (
        <img src={b.books.cover_image} alt="" style={{ width: isMobile ? 36 : 44, height: isMobile ? 50 : 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
      ) : (
        <div className="list-card-avatar" style={{ background: '#2563eb' }}>
          <Book size={isMobile ? 16 : 20} />
        </div>
      )}
      {isMobile ? (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.books?.title}</span>
            <span className={`badge ${b.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>
              {b.status}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <User size={10} /> {b.members?.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={10} /> Due: {new Date(b.due_date).toLocaleDateString()}
            </span>
            {b.status === 'borrowed' && (
              <button
                className="btn btn-success btn-sm"
                onClick={(e) => { e.stopPropagation(); setReturnConfirm(b) }}
                style={{ fontSize: 11, padding: '4px 10px', minHeight: 0, borderRadius: 8 }}
              >
                <Undo2 size={10} /> Return
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="list-card-info">
            <p className="list-card-title">{b.books?.title}</p>
            <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={11} /> {b.members?.name} · {b.members?.email}
            </p>
            <p className="list-card-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> Due: {new Date(b.due_date).toLocaleDateString()}
              {b.return_date && ` · Returned: ${new Date(b.return_date).toLocaleDateString()}`}
            </p>
          </div>
          <div className="list-card-meta">
            <span className={`badge ${b.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`}>
              {b.status}
            </span>
            {b.status === 'borrowed' && (
              <button
                className="btn btn-success btn-sm"
                style={{ marginTop: 4 }}
                onClick={(e) => { e.stopPropagation(); setReturnConfirm(b) }}
              >
                <Undo2 size={12} /> Return
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Borrow & Return</h1>
        <button className="btn btn-primary hide-mobile" onClick={() => navigate('/app/borrow-new')}><Plus size={16} /> New Borrow</button>
      </div>
      <div className="filter-bar">
        <input placeholder="Search by book or member..." value={search} onChange={(e) => { const val = e.target.value; setSearch(val); loadBorrows({ search: val }) }} />
        <select value={filter} onChange={(e) => { const val = e.target.value; setFilter(val); loadBorrows({ filter: val }) }}>
          <option value="all">All</option>
          <option value="borrowed">Borrowed</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {loading ? (
        <div className="list-cards">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={isMobile ? 'borrow-card-mobile' : 'list-card'} style={{ pointerEvents: 'none' }}>
              <div className="skeleton-circle" style={{ width: 44, height: 44 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-bar" style={{ width: '70%', marginBottom: 6 }} />
                <div className="skeleton-bar" style={{ width: '40%', height: 10 }} />
              </div>
              <div className="skeleton-badge" />
            </div>
          ))}
        </div>
      ) : borrows.length === 0 ? (
        <div className="empty-state">
          <Book size={48} />
          <h3>No borrow records found</h3>
          <p>Start by borrowing a book to a member.</p>
        </div>
      ) : (
        <>
          <div className={isMobile ? 'borrow-cards-mobile' : 'list-cards'}>
            {borrows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(b => renderCard(b))}
          </div>
          {Math.ceil(borrows.length / PAGE_SIZE) > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /> Prev</button>
              <span className="pagination-info">Page {page} of {Math.ceil(borrows.length / PAGE_SIZE)} ({borrows.length} records)</span>
              <button className="pagination-btn" disabled={page >= Math.ceil(borrows.length / PAGE_SIZE)} onClick={() => setPage(page + 1)}>Next <ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!returnConfirm}
        onClose={() => setReturnConfirm(null)}
        onConfirm={() => { handleReturn(returnConfirm); setReturnConfirm(null) }}
        title="Return Book"
        message={returnConfirm ? `Return "${returnConfirm.books?.title}" by ${returnConfirm.members?.name}?` : ''}
        confirmText="Yes, Return"
        cancelText="No"
      />
      <Fab onClick={() => navigate('/app/borrow-new')} />
    </div>
  )
}
