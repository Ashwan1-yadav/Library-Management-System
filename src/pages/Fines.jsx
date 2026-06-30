import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Search, DollarSign, CheckCircle } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Fines() {
  const { user } = useAuth()
  const [fines, setFines] = useState([])
  const [filter, setFilter] = useState('unpaid')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => { loadFines() }, [])

  const loadFines = async () => {
    setLoading(true)
    let query = supabase
      .from('fines')
      .select('*, borrows!inner(borrow_date, due_date, books(title)), members(name)')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false })

    if (filter === 'paid') query = query.eq('paid', true)
    else if (filter === 'unpaid') query = query.eq('paid', false)

    if (search) {
      query = query.or(`members.name.ilike.%${search}%,borrows.books.title.ilike.%${search}%`)
    }

    const { data } = await query
    setFines(data || [])
    setLoading(false)
  }

  const handlePay = async (id) => {
    await supabase.from('fines').update({ paid: true, paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    toast.success('Fine marked as paid')
    loadFines()
  }

  const totalUnpaid = fines.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1>Fines</h1>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle" style={{ background: '#dc262615', color: '#dc2626' }}>
              <DollarSign size={22} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Unpaid Fines</p>
              <h3 className="stat-value">₹{totalUnpaid.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="filter-bar">
        <input placeholder="Search by member or book..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="all">All</option>
        </select>
        <button className="btn btn-primary" onClick={loadFines}><Search size={16} /> Filter</button>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
              ) : fines.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>No fines found</td></tr>
              ) : fines.map((f) => (
                <tr key={f.id}>
                  <td data-label="Member">{f.members?.name}</td>
                  <td data-label="Book">{f.borrows?.books?.title}</td>
                  <td data-label="Due Date">{new Date(f.borrows?.due_date).toLocaleDateString()}</td>
                  <td data-label="Amount">₹{parseFloat(f.amount).toFixed(2)}</td>
                  <td data-label="Status">
                    <span className={`badge ${f.paid ? 'badge-success' : 'badge-danger'}`}>
                      {f.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td data-label="Paid Date">{f.paid_date ? new Date(f.paid_date).toLocaleDateString() : '-'}</td>
                  <td data-label="Action">
                    {!f.paid && (
                      <button className="btn btn-success btn-sm" onClick={() => handlePay(f.id)}>
                        <CheckCircle size={14} /> Pay Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
