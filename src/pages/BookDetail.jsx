import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ArrowLeft, Edit, Book, Calendar, Hash, Layers, FileText, ArrowRight } from 'lucide-react'
import BorrowBook from '../components/BorrowBook'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export default function BookDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBorrow, setShowBorrow] = useState(false)

  useEffect(() => { loadBook() }, [id, location.pathname])

  const loadBook = async () => {
    setLoading(true)
    const { data } = await supabase.from('books').select('*').eq('id', id).eq('admin_id', user.id).single()
    setBook(data)
    setLoading(false)
  }

  if (loading) return <div className="loading-detail" style={isMobile ? { margin: '12px 16px', borderRadius: 14 } : undefined} />
  if (!book) return <div className="empty-state"><h3>Book not found</h3></div>

  const placeholderImg = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560"><rect fill="#e5e7eb" width="400" height="560"/><text fill="#9ca3af" font-size="20" font-family="sans-serif" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No Cover</text></svg>'
  )

  const detailItems = [
    { icon: Book, label: 'Author', value: book.author },
    { icon: Hash, label: 'ISBN', value: book.isbn || '-' },
    { icon: Calendar, label: 'Published', value: book.published_year || '-' },
    { icon: Layers, label: 'Genre', value: book.genre || '-' },
    { icon: FileText, label: 'Description', value: book.description || 'No description available.', full: true },
  ]

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
      maxWidth: isMobile ? 140 : 280,
      width: '100%',
      flexShrink: 0,
    }}>
      <img
        src={book.cover_image || placeholderImg}
        alt={book.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.target.src = placeholderImg }}
      />
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
          <h1 className="member-name" style={{ marginTop: 12 }}>{book.title}</h1>
          <span className={`badge ${book.available_quantity > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 12, padding: '3px 10px' }}>
            {book.available_quantity > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <div className="member-stats-row">
          <div className="member-stat">
            <span className="member-stat-value">{book.quantity}</span>
            <span className="member-stat-label">Total Copies</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value">{book.available_quantity}</span>
            <span className="member-stat-label">Available</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value">{book.quantity - book.available_quantity}</span>
            <span className="member-stat-label">Borrowed</span>
          </div>
        </div>

        <div className="member-info-group">
          {detailItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="member-info-row">
              <div className="member-info-icon"><Icon size={16} /></div>
              <div className="member-info-text">
                <span className="member-info-label">{label}</span>
                <span className="member-info-value">{value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="member-actions" style={{ padding: '0 16px 20px' }}>
          {book.available_quantity > 0 && (
            <button className="btn btn-primary" onClick={() => setShowBorrow(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowRight size={16} /> Borrow
            </button>
          )}
          <Link to={`/app/books/${book.id}/edit`} className="btn btn-warning" style={{ width: '100%', justifyContent: 'center' }}>
            <Edit size={16} /> Edit Book
          </Link>
        </div>

        <BorrowBook open={showBorrow} onClose={() => setShowBorrow(false)} book={book} />
      </div>
    )
  }

  return (
    <div className="member-detail-page">
      <button className="btn btn-secondary back-btn" onClick={() => navigate('/app/books')}>
        <ArrowLeft size={16} /> Back to Books
      </button>

      <div className="member-detail-layout member-detail-layout--single" style={{ gridTemplateColumns: 'auto 1fr', gap: 32 }}>
        {bookCover}
        <div>
          <h1 className="member-detail-top-name" style={{ marginBottom: 8 }}>{book.title}</h1>
          <div className="detail-badges">
            <span className={`badge ${book.available_quantity > 0 ? 'badge-success' : 'badge-danger'}`}>
              {book.available_quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">Total Copies</span>
              <span className="detail-stat-value">{book.quantity}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Available</span>
              <span className="detail-stat-value">{book.available_quantity}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Borrowed</span>
              <span className="detail-stat-value">{book.quantity - book.available_quantity}</span>
            </div>
          </div>

          <div className="detail-info-grid">
            {detailItems.map(({ icon: Icon, label, value, full }) => (
              <div key={label} className={`detail-item ${full ? 'full-width' : ''}`}>
                <div className="detail-item-header">
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
                <p>{value}</p>
              </div>
            ))}
          </div>

          <div className="detail-actions">
            {book.available_quantity > 0 && (
              <button className="btn btn-primary" onClick={() => setShowBorrow(true)}><ArrowRight size={16} /> Borrow</button>
            )}
            <Link to={`/app/books/${book.id}/edit`} className="btn btn-warning"><Edit size={16} /> Edit Book</Link>
          </div>
        </div>
      </div>

      <BorrowBook open={showBorrow} onClose={() => setShowBorrow(false)} book={book} />
    </div>
  )
}
