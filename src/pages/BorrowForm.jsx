import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { ArrowLeft, Mail, Book, Hash, Calendar, ArrowRight, User } from 'lucide-react'

export default function BorrowForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [memberEmail, setMemberEmail] = useState('')
  const [member, setMember] = useState(null)
  const [memberError, setMemberError] = useState('')

  const [bookQuery, setBookQuery] = useState('')
  const [book, setBook] = useState(null)
  const [bookError, setBookError] = useState('')

  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [borrowDone, setBorrowDone] = useState(false)

  const handleEmailBlur = async () => {
    if (!memberEmail.trim()) return
    setMemberError('')
    setMember(null)
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('email', memberEmail.trim())
      .eq('admin_id', user.id)
      .single()
    if (data) {
      setMember(data)
    } else {
      setMemberError('Member not found. Please add the member first.')
      toast.error('Member not found. Please add the member first.')
    }
  }

  const handleBookBlur = async () => {
    if (!bookQuery.trim()) return
    setBookError('')
    setBook(null)

    const trimmed = bookQuery.trim()
    let query = supabase
      .from('books')
      .select('*')
      .eq('admin_id', user.id)
      .gt('available_quantity', 0)

    if (/^\d{10,13}$/.test(trimmed)) {
      query = query.eq('isbn', trimmed)
    } else {
      query = query.ilike('title', `%${trimmed}%`).limit(1)
    }

    const { data } = await query.single()
    if (data) {
      setBook(data)
    } else {
      setBookError('Book not found or out of stock.')
      toast.error('Book not found or out of stock.')
    }
  }

  const handleBorrow = async (e) => {
    e.preventDefault()
    if (!member || !book || !dueDate) return
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
    } else {
      toast.error(error.message)
    }
    setLoading(false)
  }

  const placeholderImg = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="62" viewBox="0 0 44 62"><rect fill="#e5e7eb" width="44" height="62"/><text fill="#9ca3af" font-size="8" font-family="sans-serif" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No Cover</text></svg>'
  )

  return (
    <div>
      <button className="btn btn-secondary back-btn" onClick={() => navigate('/app/borrow-return')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ maxWidth: 560, margin: '20px auto' }}>
        <div className="card-header">
          <h2>New Borrow</h2>
        </div>

        {borrowDone ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
            <h3 style={{ margin: '0 0 8px', color: '#059669' }}>Borrowed Successfully!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              {book?.title} has been borrowed by {member?.name}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => {
                setBorrowDone(false)
                setMemberEmail('')
                setMember(null)
                setBookQuery('')
                setBook(null)
                setDueDate('')
              }}>Borrow Another</button>
              <button className="btn btn-secondary" onClick={() => navigate('/app/borrow-return')}>View Borrows</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBorrow}>
            <div className="form-group">
              <label><Mail size={14} style={{ marginRight: 6 }} />Member Email *</label>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
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
              <div style={{ background: '#f0fdf4', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20, border: '1px solid #bbf7d0', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#166534" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#166534' }}>{member.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>{member.email}</p>
                  {member.phone && <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>{member.phone}</p>}
                </div>
              </div>
            )}

            <div className="form-group">
              <label><Book size={14} style={{ marginRight: 6 }} />Book ISBN or Title *</label>
              <input
                type="text"
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                onBlur={handleBookBlur}
                placeholder="Enter ISBN or book title..."
                required
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                <Hash size={10} style={{ marginRight: 4 }} />Enter 10-13 digit ISBN for exact match, or title for search
              </p>
            </div>

            {bookError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {bookError}
              </div>
            )}

            {book && (
              <div style={{ background: '#eff6ff', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20, border: '1px solid #bfdbfe', display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={book.cover_image || placeholderImg} alt="" style={{ width: 44, height: 62, objectFit: 'cover', borderRadius: 6 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>{book.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#1e40af' }}>{book.author}</p>
                  {book.isbn && <p style={{ margin: 0, fontSize: 11, color: '#1e40af' }}>ISBN: {book.isbn}</p>}
                  <p style={{ margin: 0, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                    {book.available_quantity} available
                  </p>
                </div>
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
              <button className="btn btn-primary" disabled={loading || !member || !book || !dueDate}>
                {loading ? 'Processing...' : <><ArrowRight size={16} /> Borrow</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/app/borrow-return')}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
