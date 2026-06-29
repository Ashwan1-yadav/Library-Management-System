import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

export default function Members() {
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { loadMembers(1) }, [])

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
    loadMembers(members.length === 1 && page > 1 ? page - 1 : page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="page-header">
        <h1>Members</h1>
        <Link to="/members/new" className="btn btn-primary"><Plus size={16} /> Add Member</Link>
      </div>
      <div className="search-bar">
        <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={() => loadMembers(1)}><Search size={16} /> Search</button>
      </div>
      <div className="card">
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
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>No members found</td></tr>
              ) : members.map((m) => (
                <tr key={m.id}>
                  <td data-label="Name" style={{ fontWeight: 500 }}>{m.name}</td>
                  <td data-label="Email">{m.email}</td>
                  <td data-label="Phone">{m.phone || '-'}</td>
                  <td data-label="Joined">{new Date(m.membership_date).toLocaleDateString()}</td>
                  <td data-label="Actions">
                    <div className="actions">
                      <Link to={`/members/${m.id}/edit`} className="btn btn-warning" style={{ padding: '6px 12px' }}>
                        <Edit size={14} />
                      </Link>
                      <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(m.id)}>
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
          <div className="pagination" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => loadMembers(page - 1)}><ChevronLeft size={16} /> Prev</button>
            <span className="pagination-info">Page {page} of {totalPages} ({total} members)</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => loadMembers(page + 1)}>Next <ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
