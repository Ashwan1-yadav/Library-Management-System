import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Upload, X, Image } from 'lucide-react'

export default function BookForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInput = useRef()
  const [form, setForm] = useState({ title: '', author: '', isbn: '', published_year: '', genre: '', quantity: 1, cover_image: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) loadBook()
  }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) setForm({
      title: data.title, author: data.author, isbn: data.isbn || '',
      published_year: data.published_year?.toString() || '', genre: data.genre || '',
      quantity: data.quantity, cover_image: data.cover_image || '', description: data.description || ''
    })
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }

    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(fileName, file)

    if (uploadError) {
      setError(uploadError.message)
    } else {
      const { data } = supabase.storage
        .from('book-covers')
        .getPublicUrl(fileName)
      if (data?.publicUrl) {
        setForm(prev => ({ ...prev, cover_image: data.publicUrl }))
      }
    }
    setUploading(false)
  }

  const handleRemoveImage = async () => {
    if (form.cover_image) {
      const parts = form.cover_image.split('/')
      const path = parts[parts.length - 1]
      await supabase.storage.from('book-covers').remove([path])
    }
    setForm(prev => ({ ...prev, cover_image: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const payload = {
      ...form,
      published_year: form.published_year ? parseInt(form.published_year) : null,
      available_quantity: form.quantity,
    }
    let saveError = null
    if (id) {
      const { error: err } = await supabase.from('books').update(payload).eq('id', id)
      saveError = err
    } else {
      const { error: err } = await supabase.from('books').insert(payload)
      saveError = err
    }
    setLoading(false)
    if (saveError) {
      setError(saveError.message)
    } else {
      navigate('/books')
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <h1>{id ? 'Edit Book' : 'Add Book'}</h1>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Author *</label>
              <input name="author" value={form.author} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ISBN</label>
              <input name="isbn" value={form.isbn} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Published Year</label>
              <input name="published_year" type="number" value={form.published_year} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Genre</label>
              <input name="genre" value={form.genre} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Cover Image</label>
            <div className="upload-area">
              {form.cover_image ? (
                <div className="upload-preview">
                  <img src={form.cover_image} alt="Cover preview" />
                  <button type="button" className="upload-remove" onClick={handleRemoveImage}><X size={16} /></button>
                </div>
              ) : (
                <div className="upload-placeholder" onClick={() => fileInput.current.click()}>
                  <input ref={fileInput} type="file" accept="image/*" onChange={handleUpload} hidden />
                  {uploading ? (
                    <p>Uploading...</p>
                  ) : (
                    <>
                      <Upload size={24} />
                      <p>Click to upload cover image</p>
                      <span>or paste a URL below</span>
                    </>
                  )}
                </div>
              )}
              <input
                type="url"
                name="cover_image"
                value={form.cover_image}
                onChange={handleChange}
                placeholder="Or enter image URL..."
                className="upload-url-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Book description..." />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-primary" disabled={loading || uploading}>{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/books')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
