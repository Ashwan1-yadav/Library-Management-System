import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from './Toast'
import { Modal, BottomSheet } from './BottomSheet'
import { Mail, Calendar, ArrowRight } from 'lucide-react'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  const mq = window.matchMedia(query)
  mq.addEventListener('change', (e) => setMatches(e.matches))
  return matches
}

export default function BorrowBook({ open, onClose, book }) {
  const { user } = useAuth()
  const toast = useToast()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const Wrapper = isMobile ? BottomSheet : Modal

  const [email, setEmail] = useState('')
  const [member, setMember] = useState(null)
  const [memberError, setMemberError] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [borrowDone, setBorrowDone] = useState(false)

  const handleEmailBlur = async () => {
    if (!email.trim()) return
    setMemberError('')
    setMember(null)
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('email', email.trim())
      .eq('admin_id', user.id)
      .single()
    if (data) {
      setMember(data)
    } else {
      setMemberError('Member not found. Please add the member first.')
      toast.error('Member not found. Please add the member first.')
    }
  }

  const handleBorrow = async (e) => {
    e.preventDefault()
    if (!member || !dueDate) return
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('borrows').insert({
      admin_id: user.id,
      book_id: book.id,
      member_id: member.id,
      borrow_date: today,
      due_date: dueDate,
    })

    if (!error) {
      await supabase.from('books').update({ available_quantity: book.available_quantity - 1 }).eq('id', book.id)
      toast.success(`"${book.title}" borrowed by ${member.name}`)
      setBorrowDone(true)
      setTimeout(() => {
        onClose()
        setBorrowDone(false)
        setEmail('')
        setMember(null)
        setDueDate('')
      }, 1200)
    } else {
      toast.error(error.message)
    }
    setLoading(false)
  }

  const handleClose = () => {
    setEmail('')
    setMember(null)
    setMemberError('')
    setDueDate('')
    setBorrowDone(false)
    onClose()
  }

  if (!book) return null

  return (
    <Wrapper open={open} onClose={handleClose} title="Borrow Book">
      {borrowDone ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h3 style={{ margin: 0, color: '#059669' }}>Borrowed Successfully!</h3>
        </div>
      ) : (
        <form onSubmit={handleBorrow}>
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            {book.cover_image && <img src={book.cover_image} alt="" style={{ width: 44, height: 62, objectFit: 'cover', borderRadius: 6 }} />}
            <div>
              <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{book.title}</p>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 12 }}>{book.author}</p>
              <p style={{ color: book.available_quantity > 0 ? '#059669' : '#dc2626', margin: 0, fontSize: 12, fontWeight: 600 }}>
                {book.available_quantity} available
              </p>
            </div>
          </div>

          <div className="form-group">
            <label><Mail size={14} style={{ marginRight: 6 }} />Member Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="Enter member email..."
              required
            />
          </div>

          {memberError && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {memberError}
            </div>
          )}

          {member && (
            <div style={{ background: '#f0fdf4', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20, border: '1px solid #bbf7d0' }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#166534' }}>{member.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>{member.email}</p>
              {member.phone && <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>{member.phone}</p>}
            </div>
          )}

          <div className="form-group">
            <label><Calendar size={14} style={{ marginRight: 6 }} />Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-primary" disabled={loading || !member || !dueDate}>
              {loading ? 'Processing...' : <><ArrowRight size={16} /> Borrow</>}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          </div>
        </form>
      )}
    </Wrapper>
  )
}
