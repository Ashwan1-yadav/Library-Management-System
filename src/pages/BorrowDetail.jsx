import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { ArrowLeft, Undo2, User, Book, AlertTriangle, Calendar } from 'lucide-react'
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

export default function BorrowDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isMobile = useIsMobile()
  const [borrow, setBorrow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [returnConfirm, setReturnConfirm] = useState(false)

  useEffect(() => { loadBorrow() }, [id])

  const loadBorrow = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('borrows')
      .select('*, books(*), members(*), fines(*)')
      .eq('id', id)
      .eq('admin_id', user.id)
      .single()
    setBorrow(data)
    setLoading(false)
  }

  const handleReturn = async () => {
    const { error } = await supabase
      .from('borrows')
      .update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] })
      .eq('id', borrow.id)

    if (!error) {
      const book = borrow.books
      if (book && book.available_quantity < book.quantity) {
        await supabase.from('books').update({ available_quantity: book.available_quantity + 1 }).eq('id', book.id)
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
        if (daysLate > 0) toast.info(`Late return: ₹${fineAmount} fine applied (${daysLate} days)`)
      }
      toast.success('Book returned successfully')
      loadBorrow()
    }
  }

  if (loading) return <div className="loading-detail" style={isMobile ? { margin: '12px 16px', borderRadius: 14 } : undefined} />
  if (!borrow) return <div className="empty-state"><h3>Borrow record not found</h3></div>

  const isOverdue = borrow.status === 'borrowed' && new Date(borrow.due_date) < new Date()
  const fine = borrow.fines?.[0]

  const placeholderImg = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560"><rect fill="#e5e7eb" width="400" height="560"/><text fill="#9ca3af" font-size="20" font-family="sans-serif" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No Cover</text></svg>'
  )

  const bookCover = (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: '5/7',
      maxWidth: isMobile ? 140 : 200,
      width: '100%',
      flexShrink: 0,
    }}>
      {borrow.books?.cover_image ? (
        <img src={borrow.books.cover_image} alt={borrow.books?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <Book size={isMobile ? 32 : 48} color="var(--text-muted)" />
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div className="member-detail-mobile">
        <div className="member-detail-header">
          <button className="btn btn-ghost member-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px 16px' }}>
          {bookCover}
          <h1 className="member-name" style={{ marginTop: 12 }}>{borrow.books?.title}</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className={`badge ${borrow.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 12, padding: '3px 10px' }}>
              {borrow.status}
            </span>
            {isOverdue && <span className="badge badge-danger" style={{ fontSize: 12, padding: '3px 10px' }}>Overdue</span>}
          </div>
        </div>

        <div className="member-stats-row">
          <div className="member-stat">
            <span className="member-stat-value" style={{ fontSize: 13 }}>{new Date(borrow.borrow_date).toLocaleDateString()}</span>
            <span className="member-stat-label">Borrow Date</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value" style={{ fontSize: 13 }}>{new Date(borrow.due_date).toLocaleDateString()}</span>
            <span className="member-stat-label">Due Date</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value" style={{ fontSize: 13 }}>{borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : '-'}</span>
            <span className="member-stat-label">Returned</span>
          </div>
        </div>

        <div className="member-info-group">
          <div className="member-info-row">
            <div className="member-info-icon"><User size={16} /></div>
            <div className="member-info-text">
              <span className="member-info-label">Member</span>
              <span className="member-info-value">{borrow.members?.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{borrow.members?.email}</span>
            </div>
          </div>
          <div className="member-info-row">
            <div className="member-info-icon"><Book size={16} /></div>
            <div className="member-info-text">
              <span className="member-info-label">Book</span>
              <span className="member-info-value">{borrow.books?.author}</span>
              {borrow.books?.isbn && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ISBN: {borrow.books?.isbn}</span>}
            </div>
          </div>
          {fine && (
            <div className="member-info-row">
              <div className="member-info-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><AlertTriangle size={16} /></div>
              <div className="member-info-text">
                <span className="member-info-label">Fine</span>
                <span className="member-info-value" style={{ color: '#dc2626' }}>₹{parseFloat(fine.amount).toFixed(2)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fine.paid ? 'Paid' : 'Unpaid'}</span>
              </div>
            </div>
          )}
          <div className="member-info-row">
            <div className="member-info-icon"><Calendar size={16} /></div>
            <div className="member-info-text">
              <span className="member-info-label">Duration</span>
              <span className="member-info-value">
                {new Date(borrow.borrow_date).toLocaleDateString()} → {borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : 'Present'}
              </span>
            </div>
          </div>
        </div>

        <div className="member-actions">
          {borrow.status === 'borrowed' && (
            <button className="btn btn-success" onClick={() => setReturnConfirm(true)}>
              <Undo2 size={16} /> Return Book
            </button>
          )}
        </div>

        <ConfirmDialog
          open={returnConfirm}
          onClose={() => setReturnConfirm(false)}
          onConfirm={() => { handleReturn(); setReturnConfirm(false) }}
          title="Return Book"
          message={borrow ? `Return "${borrow.books?.title}" by ${borrow.members?.name}?` : ''}
          confirmText="Yes, Return"
          cancelText="No"
        />
      </div>
    )
  }

  return (
    <div className="member-detail-page">
      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="member-detail-layout member-detail-layout--single" style={{ gridTemplateColumns: 'auto 1fr', gap: 32 }}>
        {bookCover}
        <div>
          <h1 className="member-detail-top-name" style={{ marginBottom: 8 }}>{borrow.books?.title}</h1>
          <div className="detail-badges">
            <span className={`badge ${borrow.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`}>
              {borrow.status}
            </span>
            {isOverdue && <span className="badge badge-danger">Overdue</span>}
          </div>

          <div className="detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">Borrow Date</span>
              <span className="detail-stat-value" style={{ fontSize: 16 }}>{new Date(borrow.borrow_date).toLocaleDateString()}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Due Date</span>
              <span className="detail-stat-value" style={{ fontSize: 16 }}>{new Date(borrow.due_date).toLocaleDateString()}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Return Date</span>
              <span className="detail-stat-value" style={{ fontSize: 16 }}>{borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : '-'}</span>
            </div>
          </div>

          <div className="detail-info-grid">
            <div className="detail-item">
              <div className="detail-item-header">
                <User size={16} />
                <span>Member</span>
              </div>
              <p style={{ fontWeight: 600 }}>{borrow.members?.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{borrow.members?.email}</p>
              {borrow.members?.phone && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{borrow.members?.phone}</p>}
            </div>
            <div className="detail-item">
              <div className="detail-item-header">
                <Book size={16} />
                <span>Book Details</span>
              </div>
              <p>Author: {borrow.books?.author}</p>
              {borrow.books?.isbn && <p style={{ fontSize: 12 }}>ISBN: {borrow.books?.isbn}</p>}
            </div>
            {fine && (
              <div className="detail-item">
                <div className="detail-item-header">
                  <AlertTriangle size={16} />
                  <span>Fine</span>
                </div>
                <p style={{ color: '#dc2626', fontWeight: 600 }}>₹{parseFloat(fine.amount).toFixed(2)}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fine.paid ? 'Paid' : 'Unpaid'}</p>
              </div>
            )}
          </div>

          <div className="detail-actions">
            {borrow.status === 'borrowed' && (
              <button className="btn btn-success" onClick={() => setReturnConfirm(true)}>
                <Undo2 size={16} /> Return Book
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={returnConfirm}
        onClose={() => setReturnConfirm(false)}
        onConfirm={() => { handleReturn(); setReturnConfirm(false) }}
        title="Return Book"
        message={borrow ? `Return "${borrow.books?.title}" by ${borrow.members?.name}?` : ''}
        confirmText="Yes, Return"
        cancelText="No"
      />
    </div>
  )
}
