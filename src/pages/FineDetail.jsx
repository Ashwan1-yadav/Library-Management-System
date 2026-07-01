import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { ArrowLeft, User, Book, Calendar, CheckCircle, Clock } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function FineDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [fine, setFine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payConfirm, setPayConfirm] = useState(false)

  useEffect(() => { loadFine() }, [id])

  const loadFine = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fines')
      .select('*, borrows(*, books(title, author, isbn, cover_image)), members(name, email, phone)')
      .eq('id', id)
      .eq('admin_id', user.id)
      .single()
    setFine(data)
    setLoading(false)
  }

  const handlePay = async () => {
    await supabase.from('fines').update({ paid: true, paid_date: new Date().toISOString().split('T')[0] }).eq('id', fine.id)
    toast.success('Fine marked as paid')
    loadFine()
  }

  if (loading) return <div className="loading-detail" />
  if (!fine) return <div className="empty-state"><h3>Fine not found</h3></div>

  const borrow = fine.borrows
  const member = fine.members
  const daysLate = Math.ceil((new Date(borrow?.return_date || new Date()) - new Date(borrow?.due_date)) / (1000 * 60 * 60 * 24))

  return (
    <div className="member-detail-page">
      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="member-detail-top">
        <div className="member-detail-avatar-small" style={{ background: fine.paid ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }}>
          ₹
        </div>
        <div>
          <h1 className="member-detail-top-name">₹{parseFloat(fine.amount).toFixed(2)}</h1>
          <span className={`badge ${fine.paid ? 'badge-success' : 'badge-danger'}`}>
            {fine.paid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </div>

      <div className="member-detail-layout member-detail-layout--single">
        <div>
          <div className="detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">Fine Amount</span>
              <span className="detail-stat-value">₹{parseFloat(fine.amount).toFixed(2)}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Status</span>
              <span className="detail-stat-value">{fine.paid ? 'Paid' : 'Unpaid'}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Paid Date</span>
              <span className="detail-stat-value">{fine.paid_date ? new Date(fine.paid_date).toLocaleDateString() : '-'}</span>
            </div>
          </div>

          <div className="detail-info-grid">
            {member && (
              <div className="detail-item">
                <div className="detail-item-header">
                  <User size={16} />
                  <span>Member</span>
                </div>
                <p style={{ fontWeight: 600 }}>{member.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.email}</p>
                {member.phone && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.phone}</p>}
              </div>
            )}
            {borrow && (
              <>
                <div className="detail-item">
                  <div className="detail-item-header">
                    <Book size={16} />
                    <span>Book</span>
                  </div>
                  <p>{borrow.books?.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {borrow.books?.author}</p>
                </div>
                <div className="detail-item">
                  <div className="detail-item-header">
                    <Calendar size={16} />
                    <span>Borrow Details</span>
                  </div>
                  <p>Borrowed: {new Date(borrow.borrow_date).toLocaleDateString()}</p>
                  <p>Due: {new Date(borrow.due_date).toLocaleDateString()}</p>
                  {borrow.return_date && <p>Returned: {new Date(borrow.return_date).toLocaleDateString()}</p>}
                </div>
                <div className="detail-item">
                  <div className="detail-item-header">
                    <Clock size={16} />
                    <span>Days Late</span>
                  </div>
                  <p>{daysLate} days</p>
                </div>
              </>
            )}
          </div>

          <div className="detail-actions">
            {!fine.paid && (
              <button className="btn btn-success" onClick={() => setPayConfirm(true)}>
                <CheckCircle size={16} /> Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={payConfirm}
        onClose={() => setPayConfirm(false)}
        onConfirm={() => { handlePay(); setPayConfirm(false) }}
        title="Mark Fine as Paid"
        message={member ? `Mark ₹${parseFloat(fine.amount).toFixed(2)} fine for "${member.name}" as paid?` : ''}
        confirmText="Yes, Mark Paid"
        cancelText="Cancel"
      />
    </div>
  )
}
