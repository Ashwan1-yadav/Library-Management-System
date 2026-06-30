import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Camera, Save, Mail, Phone, MapPin } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function AdminProfile() {
  const { user, profile, updateProfile } = useAuth()
  const fileInput = useRef()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [avatar, setAvatar] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '', address: profile.address || '' })
      setAvatar(profile.avatar_url || '')
    }
  }, [profile])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB'); return }

    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const fileName = `avatars/${user.id}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('book-covers').upload(fileName, file)
      if (uploadError) {
        if (uploadError.message.includes('violates policy')) {
          setError('Storage permission error. Run fix-storage-policies.sql in Supabase SQL editor.')
        } else {
          setError(uploadError.message)
        }
      } else {
        const { data } = supabase.storage.from('book-covers').getPublicUrl(fileName)
        if (data?.publicUrl) {
          setAvatar(data.publicUrl)
          await updateProfile({ avatar_url: data.publicUrl })
          toast.success('Profile photo updated')
        }
      }
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated successfully')
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const placeholderAvatar = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="#eaeaea" width="120" height="120" rx="60"/><text fill="#2d2d2d" font-size="40" font-family="sans-serif" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">' + (user?.email?.charAt(0).toUpperCase() || 'A') + '</text></svg>'
  )

  return (
    <div>
      <div className="page-header">
        <h1>Admin Profile</h1>
      </div>
      <div className="profile-layout">
        <div className="card profile-sidebar-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <img src={avatar || placeholderAvatar} alt="Avatar" onError={(e) => { e.target.src = placeholderAvatar }} />
              <button className="profile-avatar-btn" onClick={() => fileInput.current.click()} title="Change photo">
                <Camera size={16} />
              </button>
              <input ref={fileInput} type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </div>
            <h3>{profile?.name || user?.email?.split('@')[0]}</h3>
            <span className="badge badge-success">Administrator</span>
          </div>
          <div className="profile-info-list">
            <div className="profile-info-item">
              <Mail size={16} />
              <span>{user?.email}</span>
            </div>
            {profile?.phone && (
              <div className="profile-info-item">
                <Phone size={16} />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.address && (
              <div className="profile-info-item">
                <MapPin size={16} />
                <span>{profile.address}</span>
              </div>
            )}
          </div>
        </div>
        <div className="card profile-form-card">
          <h2>Edit Profile</h2>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 555-0000" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Your address" />
              </div>
            </div>
            <button className="btn btn-primary" disabled={saving || uploading}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
