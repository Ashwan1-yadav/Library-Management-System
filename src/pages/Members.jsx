import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useToast } from '../components/Toast'
import Fab from '../components/Fab'

const PAGE_SIZE = 10

export default function Members() {
  const navigate = useNavigate()
  const location = useLocation()
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const toast = useToast()

  useEffect(() => { loadMembers(1) }, [location.pathname])

  const loadMembers = async (p) => {
    setLoading(true)
    setPage(p)
    let query = supabase.from('members').select('*', { count: 'exact' }).order('name')
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, count } = await query.range(from, to)
    setMembers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return
    await supabase.from('members').delete().eq('id', id)
    toast.success('Member deleted')
    loadMembers(members.length === 1 && page > 1 ? page - 1 : page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="page-header">
        <h1>Members</h1>
        <Link to="/app/members/new" className="btn btn-primary hide-mobile"><Plus size={16} /> Add Member</Link>
      </div>
      <div className="search-bar">
        <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadMembers(1)} />
        <button className="btn btn-primary" onClick={() => loadMembers(1)}><Search size={16} /> Search</button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Membership Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={5}>
                <div className="empty-state">
                  <Users size={48} />
                  <h3>No members found</h3>
                  <p>Try a different search or add a new member.</p>
                </div>
              </td></tr>
            ) : members.map((m) => (
              <tr key={m.id}>
                <td data-label="Name" style={{ fontWeight: 500 }}>{m.name}</td>
                <td data-label="Email">{m.email}</td>
                <td data-label="Phone">{m.phone || '-'}</td>
                <td data-label="Joined">{new Date(m.membership_date).toLocaleDateString()}</td>
                <td data-label="Actions">
                  <div className="actions">
                    <Link to={`/app/members/${m.id}/edit`} className="btn btn-warning btn-sm" title="Edit">
                      <Edit size={14} />
                    </Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => loadMembers(page - 1)}><ChevronLeft size={16} /> Prev</button>
          <span className="pagination-info">Page {page} of {totalPages} ({total} members)</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => loadMembers(page + 1)}>Next <ChevronRight size={16} /></button>
        </div>
      )}
      <Fab onClick={() => navigate('/app/members/new')} />
    </div>
  )
}
