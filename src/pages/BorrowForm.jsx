import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { ArrowLeft, Mail, Book, Hash, Calendar, ArrowRight, User, CheckCircle } from 'lucide-react'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export default function BorrowForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const isMobile = useIsMobile()

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

    const hasHyphen = trimmed.includes('-')
    const allDigits = /^\d{10,13}$/.test(trimmed)

    if (hasHyphen || allDigits) {
      // ISBN search — try exact ilike match first
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('admin_id', user.id)
        .gt('available_quantity', 0)
        .ilike('isbn', trimmed)
        .maybeSingle()
      if (data) { setBook(data); return }

      // Fallback: compare stripped ISBNs (handles seed data with hex chars)
      const normalized = trimmed.replace(/[-\s]/g, '').toLowerCase()
      let { data: all } = await supabase
        .from('books')
        .select('*')
        .eq('admin_id', user.id)
        .gt('available_quantity', 0)
      if (all) {
        const match = all.find(b => b.isbn.replace(/[-\s]/g, '').toLowerCase() === normalized)
        if (match) { setBook(match); return }
      }

      setBookError('Book not found or out of stock.')
      toast.error('Book not found or out of stock.')
      return
    }

    // Title search
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('admin_id', user.id)
      .gt('available_quantity', 0)
      .ilike('title', `%${trimmed}%`)
      .limit(1)
      .maybeSingle()
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

  if (isMobile) {
    return (
      <div className="borrow-form-mobile">
        <div className="borrow-form-header">
          <button className="borrow-form-back" onClick={() => navigate('/app/borrow-return')}><ArrowLeft size={22} /></button>
          <h1>New Borrow</h1>
          <div style={{ width: 40 }} />
        </div>

        {borrowDone ? (
          <div className="borrow-form-success">
            <div className="borrow-form-success-icon"><CheckCircle size={48} /></div>
            <h3>Borrowed Successfully!</h3>
            <p>{book?.title} has been borrowed by {member?.name}</p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => {
              setBorrowDone(false)
              setMemberEmail('')
              setMember(null)
              setBookQuery('')
              setBook(null)
              setDueDate('')
            }}>Borrow Another</button>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/app/borrow-return')}>View Borrows</button>
          </div>
        ) : (
          <form onSubmit={handleBorrow} className="borrow-form-body">
            <div className="form-section">
              <div className="form-section-title">MEMBER</div>
              <div className="form-ios-group">
                <div className="form-ios-row">
                  <label>Email</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="Enter member email..."
                    required
                  />
                </div>
              </div>
              {memberError && <div className="borrow-form-error">{memberError}</div>}
              {member && (
                <div className="borrow-form-found">
                  <div className="borrow-form-found-avatar" style={{ background: '#dcfce7' }}>
                    <User size={18} color="#166534" />
                  </div>
                  <div className="borrow-form-found-info">
                    <p className="borrow-form-found-name">{member.name}</p>
                    <p className="borrow-form-found-sub">{member.email}</p>
                    {member.phone && <p className="borrow-form-found-sub">{member.phone}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title">BOOK</div>
              <div className="form-ios-group">
                <div className="form-ios-row">
                  <label>ISBN or Title</label>
                  <input
                    type="text"
                    value={bookQuery}
                    onChange={(e) => setBookQuery(e.target.value)}
                    onBlur={handleBookBlur}
                    placeholder="Enter ISBN or book title..."
                    required
                  />
                </div>
              </div>
              <p className="borrow-form-hint"><Hash size={11} /> Enter 10-13 digit ISBN for exact match, or title for search</p>
              {bookError && <div className="borrow-form-error">{bookError}</div>}
              {book && (
                <div className="borrow-form-found">
                  <img src={book.cover_image || placeholderImg} alt="" className="borrow-form-found-cover" />
                  <div className="borrow-form-found-info">
                    <p className="borrow-form-found-name">{book.title}</p>
                    <p className="borrow-form-found-sub">{book.author}</p>
                    {book.isbn && <p className="borrow-form-found-sub">ISBN: {book.isbn}</p>}
                    <p className="borrow-form-found-stock">{book.available_quantity} available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <div className="form-section-title">DUE DATE</div>
              <div className="form-ios-group">
                <div className="form-ios-row">
                  <label>Return by</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
            </div>

            <button className="btn btn-primary borrow-form-submit" disabled={loading || !member || !book || !dueDate}>
              {loading ? 'Processing...' : <><ArrowRight size={18} /> Borrow Book</>}
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Borrow</h1>
      </div>
      <div className="card" style={{ maxWidth: 600 }}>
        {borrowDone ? (
          <div className="borrow-form-success-web" style={{ padding: '40px 0' }}>
            <div className="borrow-form-success-web-icon"><CheckCircle size={40} /></div>
            <h3>Borrowed Successfully!</h3>
            <p>{book?.title} has been borrowed by {member?.name}</p>
            <div className="borrow-form-success-web-actions">
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
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label><Mail size={14} style={{ marginRight: 4 }} /> Member Email</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="Enter member email..."
                  required
                />
              </div>
            </div>
            {memberError && <div className="borrow-form-error-web">{memberError}</div>}
            {member && (
              <div className="borrow-form-found-web member">
                <div className="borrow-form-found-avatar" style={{ background: '#dcfce7' }}>
                  <User size={20} color="#166534" />
                </div>
                <div className="borrow-form-found-info">
                  <p className="borrow-form-found-name">{member.name}</p>
                  <p className="borrow-form-found-sub">{member.email}</p>
                  {member.phone && <p className="borrow-form-found-sub">{member.phone}</p>}
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label><Book size={14} style={{ marginRight: 4 }} /> ISBN or Title</label>
                <input
                  type="text"
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  onBlur={handleBookBlur}
                  placeholder="Enter ISBN or book title..."
                  required
                />
                <p className="borrow-form-hint-web"><Hash size={10} /> Enter 10-13 digit ISBN for exact match, or title for search</p>
              </div>
            </div>
            {bookError && <div className="borrow-form-error-web">{bookError}</div>}
            {book && (
              <div className="borrow-form-found-web book">
                <img src={book.cover_image || placeholderImg} alt="" className="borrow-form-found-cover" />
                <div className="borrow-form-found-info">
                  <p className="borrow-form-found-name">{book.title}</p>
                  <p className="borrow-form-found-sub">{book.author}</p>
                  {book.isbn && <p className="borrow-form-found-sub">ISBN: {book.isbn}</p>}
                  <p className="borrow-form-found-stock">{book.available_quantity} available</p>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label><Calendar size={14} style={{ marginRight: 4 }} /> Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" disabled={loading || !member || !book || !dueDate}>
                {loading ? 'Processing...' : <><ArrowRight size={16} /> Borrow Book</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/app/borrow-return')}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
