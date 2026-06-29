import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MemberForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) loadMember()
  }, [id])

  const loadMember = async () => {
    const { data } = await supabase.from('members').select('*').eq('id', id).single()
    if (data) setForm({ name: data.name, email: data.email, phone: data.phone || '', address: data.address || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    let saveError = null
    if (id) {
      const { error: err } = await supabase.from('members').update(form).eq('id', id)
      saveError = err
    } else {
      const { error: err } = await supabase.from('members').insert(form)
      saveError = err
    }
    setLoading(false)
    if (saveError) {
      setError(saveError.message)
    } else {
      navigate('/members')
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <h1>{id ? 'Edit Member' : 'Add Member'}</h1>
      </div>
      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={3} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/members')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
