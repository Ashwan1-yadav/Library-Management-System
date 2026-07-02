import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { ArrowLeft, User, Book, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
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

export default function FineDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isMobile = useIsMobile()
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

  if (loading) return <div className="loading-detail" style={isMobile ? { margin: '12px 16px', borderRadius: 14 } : undefined} />
  if (!fine) return <div className="empty-state"><h3>Fine not found</h3></div>

  const borrow = fine.borrows
  const member = fine.members
  const daysLate = Math.ceil((new Date(borrow?.return_date || new Date()) - new Date(borrow?.due_date)) / (1000 * 60 * 60 * 24))

  const fineGradient = fine.paid
    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'

  if (isMobile) {
    return (
      <div className="member-detail-mobile">
        <div className="member-detail-header">
          <button className="btn btn-ghost member-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
        </div>

        <div className="member-avatar-section">
          <div className="member-avatar-circle" style={{ background: fineGradient }}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>₹</span>
          </div>
          <h1 className="member-name">₹{parseFloat(fine.amount).toFixed(2)}</h1>
          <span className={`badge ${fine.paid ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 12, padding: '3px 10px' }}>
            {fine.paid ? 'Paid' : 'Unpaid'}
          </span>
        </div>

        <div className="member-stats-row">
          <div className="member-stat">
            <span className="member-stat-value">₹{parseFloat(fine.amount).toFixed(2)}</span>
            <span className="member-stat-label">Amount</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value">{fine.paid ? 'Paid' : 'Unpaid'}</span>
            <span className="member-stat-label">Status</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value">{fine.paid_date ? new Date(fine.paid_date).toLocaleDateString() : '-'}</span>
            <span className="member-stat-label">Paid Date</span>
          </div>
        </div>

        <div className="member-info-group">
          {member && (
            <div className="member-info-row">
              <div className="member-info-icon"><User size={16} /></div>
              <div className="member-info-text">
                <span className="member-info-label">Member</span>
                <span className="member-info-value">{member.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.email}</span>
              </div>
            </div>
          )}
          {borrow && (
            <>
              <div className="member-info-row">
                <div className="member-info-icon"><Book size={16} /></div>
                <div className="member-info-text">
                  <span className="member-info-label">Book</span>
                  <span className="member-info-value">{borrow.books?.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {borrow.books?.author}</span>
                </div>
              </div>
              <div className="member-info-row">
                <div className="member-info-icon"><Calendar size={16} /></div>
                <div className="member-info-text">
                  <span className="member-info-label">Borrow Period</span>
                  <span className="member-info-value">
                    {new Date(borrow.borrow_date).toLocaleDateString()} → {borrow.return_date ? new Date(borrow.return_date).toLocaleDateString() : 'Present'}
                  </span>
                </div>
              </div>
              <div className="member-info-row">
                <div className="member-info-icon" style={{ background: daysLate > 0 ? '#fef2f2' : '#f0fdf4', color: daysLate > 0 ? '#dc2626' : '#059669' }}>
                  <Clock size={16} />
                </div>
                <div className="member-info-text">
                  <span className="member-info-label">Days Late</span>
                  <span className="member-info-value" style={{ color: daysLate > 0 ? '#dc2626' : '#059669' }}>
                    {daysLate > 0 ? `${daysLate} days` : 'On time'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="member-actions" style={{ padding: '0 16px 20px' }}>
          {!fine.paid && (
            <button className="btn btn-success" onClick={() => setPayConfirm(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <CheckCircle size={16} /> Mark as Paid
            </button>
          )}
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

  return (
    <div className="member-detail-page">
      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="member-detail-top">
        <div className="member-detail-avatar-small" style={{ background: fineGradient }}>
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
