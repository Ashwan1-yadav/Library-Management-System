import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Edit, Book, User, Calendar, Hash, Layers, FileText, CheckCircle, XCircle } from 'lucide-react'

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBook() }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    setBook(data)
    setLoading(false)
  }

  if (loading) return <div className="loading-detail" />
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

  return (
    <div className="book-detail">
      <button className="btn btn-secondary back-btn" onClick={() => navigate('/books')}>
        <ArrowLeft size={16} /> Back to Books
      </button>
      <div className="book-detail-content">
        <div className="book-detail-img">
          <img src={book.cover_image || placeholderImg} alt={book.title} onError={(e) => { e.target.src = placeholderImg }} />
        </div>
        <div className="book-detail-info">
          <h1>{book.title}</h1>
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
            <Link to={`/books/${book.id}/edit`} className="btn btn-warning"><Edit size={16} /> Edit Book</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
