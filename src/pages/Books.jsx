import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Library, ArrowRight, BookOpen } from 'lucide-react'
import { useToast } from '../components/Toast'
import Fab from '../components/Fab'
import BorrowBook from '../components/BorrowBook'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZE = 8

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export default function Books() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const toast = useToast()
  const [borrowBook, setBorrowBook] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

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
    setDeleteConfirm(id)
  }

  const confirmDelete = async () => {
    await supabase.from('books').delete().eq('id', deleteConfirm)
    toast.success('Book deleted')
    loadBooks(books.length === 1 && page > 1 ? page - 1 : page)
    setDeleteConfirm(null)
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
          {[1,2,3,4,5,6].map(i => <div key={i} className="book-card skeleton"><div className="skeleton-img" /><div className="skeleton-body"><div className="skeleton-text" /><div className="skeleton-text short" /></div></div>)}
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
                {!isMobile && (
                  <div className="book-card-actions" onClick={(e) => e.stopPropagation()}>
                    {book.available_quantity > 0 && (
                      <button className="btn-icon" title="Borrow" onClick={(e) => { e.stopPropagation(); setBorrowBook(book) }}><ArrowRight size={16} /></button>
                    )}
                    <Link to={`/app/books/${book.id}/edit`} className="btn-icon" title="Edit"><Edit size={16} /></Link>
                    <button className="btn-icon danger" onClick={(e) => handleDelete(e, book.id)} title="Delete"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={page <= 1} onClick={() => loadBooks(page - 1)}><ChevronLeft size={16} /> Prev</button>
              <span className="pagination-info">Page {page} of {totalPages} ({total} books)</span>
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => loadBooks(page + 1)}>Next <ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}
      <Fab onClick={() => navigate('/app/books/new')} />
      <BorrowBook open={!!borrowBook} onClose={() => setBorrowBook(null)} book={borrowBook} />
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger
      />
    </div>
  )
}
