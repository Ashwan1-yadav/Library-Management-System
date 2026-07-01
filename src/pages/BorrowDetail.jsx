import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { ArrowLeft, Undo2, User, Book, AlertTriangle } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function BorrowDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
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

  if (loading) return <div className="loading-detail" />
  if (!borrow) return <div className="empty-state"><h3>Borrow record not found</h3></div>

  const isOverdue = borrow.status === 'borrowed' && new Date(borrow.due_date) < new Date()
  const fine = borrow.fines?.[0]

  return (
    <div className="book-detail">
      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="book-detail-content">
        <div className="book-detail-img">
          {borrow.books?.cover_image ? (
            <img src={borrow.books.cover_image} alt={borrow.books?.title} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Book size={48} />
            </div>
          )}
        </div>
        <div className="book-detail-info">
          <h1>{borrow.books?.title}</h1>
          <div className="detail-badges">
            <span className={`badge ${borrow.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`}>
              {borrow.status}
            </span>
            {isOverdue && <span className="badge badge-danger" style={{ marginLeft: 8 }}>Overdue</span>}
          </div>
          <div className="detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">Borrow Date</span>
              <span className="detail-stat-value">{new Date(borrow.borrow_date).toLocaleDateString()}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Due Date</span>
              <span className="detail-stat-value">{new Date(borrow.due_date).toLocaleDateString()}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Return Date</span>
              <span className="detail-stat-value">{borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : '-'}</span>
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
