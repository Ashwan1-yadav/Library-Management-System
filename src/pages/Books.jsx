import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Library } from 'lucide-react'
import { useToast } from '../components/Toast'
import Fab from '../components/Fab'

const PAGE_SIZE = 12

export default function Books() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const visibleRef = useRef(false)

  const loadBooks = async (p) => {
    setLoading(true)
    setPage(p)
    let query = supabase.from('books').select('*', { count: 'exact' }).eq('admin_id', user.id).order('title')
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`)
    }
    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count } = await query.range(from, to)
    setBooks(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  useEffect(() => { loadBooks(1) }, [])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadBooks(1) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const handleSearch = () => loadBooks(1)

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this book?')) return
    await supabase.from('books').delete().eq('id', id)
    toast.success('Book deleted')
    loadBooks(books.length === 1 && page > 1 ? page - 1 : page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const placeholderImg = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect fill="#e5e7eb" width="200" height="280"/><text fill="#9ca3af" font-size="14" font-family="sans-serif" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">No Cover</text></svg>'
  )

  return (
    <div>
      <div className="page-header">
        <h1>Books</h1>
        <Link to="/app/books/new" className="btn btn-primary hide-mobile"><Plus size={16} /> Add Book</Link>
      </div>
      <div className="search-bar">
        <input placeholder="Search by title, author or ISBN..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <button className="btn btn-primary" onClick={handleSearch}><Search size={16} /> Search</button>
      </div>
      {loading ? (
        <div className="loading-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="book-card skeleton"><div className="skeleton-img" /><div className="skeleton-text" /><div className="skeleton-text short" /></div>)}
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <Library size={48} />
          <h3>No books found</h3>
          <p>Try a different search or add a new book.</p>
        </div>
      ) : (
        <>
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card" onClick={() => navigate(`/app/books/${book.id}`)}>
                <div className="book-card-img">
                  <img src={book.cover_image || placeholderImg} alt={book.title} loading="lazy" onError={(e) => { e.target.src = placeholderImg }} />
                </div>
                <div className="book-card-body">
                  <h3 className="book-card-title">{book.title}</h3>
                  <p className="book-card-author">{book.author}</p>
                  <div className="book-card-meta">
                    {book.genre && <span className="badge badge-genre">{book.genre}</span>}
                    <span className={`badge ${book.available_quantity > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {book.available_quantity} / {book.quantity}
                    </span>
                  </div>
                </div>
                <div className="book-card-actions" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/app/books/${book.id}/edit`} className="btn-icon" title="Edit"><Edit size={16} /></Link>
                  <button className="btn-icon danger" onClick={(e) => handleDelete(e, book.id)} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => loadBooks(page - 1)}><ChevronLeft size={16} /> Prev</button>
              <span className="pagination-info">Page {page} of {totalPages} ({total} books)</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => loadBooks(page + 1)}>Next <ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}
      <Fab onClick={() => navigate('/app/books/new')} />
    </div>
  )
}
