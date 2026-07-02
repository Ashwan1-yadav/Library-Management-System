import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { Mail, Book, Hash, Calendar, ArrowRight, User, CheckCircle, Scan } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { Modal } from '../components/BottomSheet'

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

  const scannerRef = useRef(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)

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

  const handleBookBlur = () => handleBookLookup(bookQuery)

  useEffect(() => {
    if (!showScanner || !scanning) return
    let cancelled = false
    const init = async () => {
      await new Promise(r => requestAnimationFrame(r))
      if (cancelled) return
      const el = document.getElementById('scanner-el')
      if (!el) return
      try {
        const scanner = new Html5Qrcode('scanner-el')
        if (cancelled) return
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 30, qrbox: { width: 280, height: 200 } },
          (decodedText) => {
            scanner.stop().catch(() => {})
            scannerRef.current = null
            setScanning(false)
            setShowScanner(false)
            setBookQuery(decodedText)
            handleBookLookup(decodedText)
          },
          () => {}
        )
      } catch {
        if (!cancelled) {
          toast.error('Unable to access camera. Please check permissions.')
          setScanning(false)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [showScanner, scanning])

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
    setShowScanner(false)
  }

  const handleBookLookup = async (query) => {
    if (!query.trim()) return
    setBookError('')
    setBook(null)

    const trimmed = query.trim()
    const hasHyphen = trimmed.includes('-')
    const allDigits = /^\d{10,13}$/.test(trimmed)

    if (hasHyphen || allDigits) {
      let { data } = await supabase
        .from('books')
        .select('*')
        .eq('admin_id', user.id)
        .gt('available_quantity', 0)
        .ilike('isbn', trimmed)
        .maybeSingle()
      if (data) { setBook(data); return }

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
                <div className="isbn-input-wrap">
                  <input
                    type="text"
                    value={bookQuery}
                    onChange={(e) => setBookQuery(e.target.value)}
                    onBlur={handleBookBlur}
                    placeholder="Enter ISBN or book title..."
                    required
                  />
                  <button type="button" className="btn btn-ghost scan-btn" onClick={() => { setShowScanner(true); setScanning(true) }} title="Scan ISBN barcode">
                    <Scan size={18} />
                  </button>
                </div>
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

      <Modal open={showScanner} onClose={stopScanner} title="Scan ISBN Barcode">
        {scanning && <div id="scanner-el" style={{ width: '100%', minHeight: 300 }} />}
        {!scanning && showScanner && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)' }}>Camera access denied or unavailable.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setScanning(true)}>Retry</button>
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={stopScanner}>Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
