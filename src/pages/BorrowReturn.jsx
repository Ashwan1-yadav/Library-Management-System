import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Undo2, Search } from 'lucide-react'
import { BottomSheet, Modal } from '../components/BottomSheet'
import { useToast } from '../components/Toast'
import Fab from '../components/Fab'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export default function BorrowReturn() {
  const [borrows, setBorrows] = useState([])
  const [books, setBooks] = useState([])
  const [members, setMembers] = useState([])
  const [showSheet, setShowSheet] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ book_id: '', member_id: '', due_date: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const FormWrapper = isMobile ? BottomSheet : Modal

  useEffect(() => {
    loadBorrows()
    loadBooks()
    loadMembers()
  }, [])

  const loadBorrows = async (opts) => {
    const s = opts?.search ?? search
    const f = opts?.filter ?? filter

    let query = supabase
      .from('borrows')
      .select('*, books(title, author), members(name)')
      .order('created_at', { ascending: false })

    if (f === 'borrowed') query = query.eq('status', 'borrowed')
    else if (f === 'returned') query = query.eq('status', 'returned')

    const { data } = await query
    let result = data || []

    const q = s.toLowerCase()
    if (q) {
      result = result.filter(
        (b) => b.books?.title?.toLowerCase().includes(q) || b.members?.name?.toLowerCase().includes(q)
      )
    }

    setBorrows(result)
  }

  const loadBooks = async () => {
    const { data } = await supabase.from('books').select('*').gt('available_quantity', 0).order('title')
    setBooks(data || [])
  }

  const loadMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('name')
    setMembers(data || [])
  }

  const handleBorrow = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.from('borrows').insert({
      ...form,
      borrow_date: new Date().toISOString().split('T')[0],
    })
    if (err) {
      setError(err.message)
    } else {
      const { data: book } = await supabase.from('books').select('available_quantity').eq('id', form.book_id).single()
      if (book) {
        await supabase.from('books').update({ available_quantity: book.available_quantity - 1 }).eq('id', form.book_id)
      }
      setShowSheet(false)
      setForm({ book_id: '', member_id: '', due_date: '' })
      toast.success('Book borrowed successfully')
      loadBorrows()
      loadBooks()
    }
    setLoading(false)
  }

  const handleReturn = async (borrow) => {
    const { error: err } = await supabase
      .from('borrows')
      .update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] })
      .eq('id', borrow.id)

    if (!err) {
      const { data: book } = await supabase.from('books').select('available_quantity, quantity').eq('id', borrow.book_id).single()
      if (book && book.available_quantity < book.quantity) {
        await supabase.from('books').update({ available_quantity: book.available_quantity + 1 }).eq('id', borrow.book_id)
      }
      const dueDate = new Date(borrow.due_date)
      const returnDate = new Date()
      if (returnDate > dueDate) {
        const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24))
        const fineAmount = daysLate * 10
        await supabase.from('fines').insert({
          borrow_id: borrow.id,
          member_id: borrow.member_id,
          amount: fineAmount,
        })
        if (daysLate > 0) {
          toast.info(`Late return: $${fineAmount} fine applied (${daysLate} days)`)
        }
      }
      toast.success('Book returned successfully')
      loadBorrows()
      loadBooks()
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Borrow & Return</h1>
        <button className="btn btn-primary hide-mobile" onClick={() => setShowSheet(true)}><Plus size={16} /> New Borrow</button>
      </div>
      <div className="filter-bar">
        <input placeholder="Search by book or member..." value={search} onChange={(e) => { const val = e.target.value; setSearch(val); loadBorrows({ search: val }) }} />
        <select value={filter} onChange={(e) => { const val = e.target.value; setFilter(val); loadBorrows({ filter: val }) }}>
          <option value="all">All</option>
          <option value="borrowed">Borrowed</option>
          <option value="returned">Returned</option>
        </select>
        <button className="btn btn-primary" onClick={loadBorrows}><Search size={16} /> Filter</button>
      </div>
      <div className="borrow-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Book</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Return Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {borrows.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No borrow records found</td></tr>
            ) : borrows.map((b) => (
              <tr key={b.id}>
                <td data-label="Member">{b.members?.name}</td>
                <td data-label="Book">{b.books?.title}</td>
                <td data-label="Borrow Date">{new Date(b.borrow_date).toLocaleDateString()}</td>
                <td data-label="Due Date">{new Date(b.due_date).toLocaleDateString()}</td>
                <td data-label="Return Date">{b.return_date ? new Date(b.return_date).toLocaleDateString() : '-'}</td>
                <td data-label="Status">
                  <span className={`badge ${b.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`}>
                    {b.status}
                  </span>
                </td>
                <td data-label="Action">
                  {b.status === 'borrowed' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleReturn(b)}>
                      <Undo2 size={14} /> Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormWrapper open={showSheet} onClose={() => setShowSheet(false)} title="New Borrow">
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleBorrow}>
          <div className="form-group">
            <label>Member *</label>
            <select name="member_id" value={form.member_id} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} required>
              <option value="">Select member...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Book *</label>
            <select name="book_id" value={form.book_id} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} required>
              <option value="">Select book...</option>
              {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({b.available_quantity} avail)</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date *</label>
            <input type="date" name="due_date" value={form.due_date} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Borrow'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSheet(false)}>Cancel</button>
          </div>
        </form>
      </FormWrapper>
      <Fab onClick={() => setShowSheet(true)} />
    </div>
  )
}
