import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Book, ArrowRight, Edit, Trash2 } from 'lucide-react'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

export default function MemberDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isMobile = useIsMobile()
  const [member, setMember] = useState(null)
  const [borrows, setBorrows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => { loadMember() }, [id])

  const loadMember = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .eq('admin_id', user.id)
      .single()
    setMember(data)

    if (data) {
      const { data: borrowData } = await supabase
        .from('borrows')
        .select('*, books(title, author, cover_image)')
        .eq('member_id', id)
        .eq('admin_id', user.id)
        .order('created_at', { ascending: false })
      setBorrows(borrowData || [])
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    await supabase.from('members').delete().eq('id', id)
    toast.success('Member deleted')
    navigate('/app/members')
  }

  if (loading) return <div className="loading-detail" style={isMobile ? { margin: '12px 16px', borderRadius: 14 } : undefined} />
  if (!member) return <div className="empty-state"><h3>Member not found</h3></div>

  const activeBorrows = borrows.filter(b => b.status === 'borrowed').length
  const totalBorrows = borrows.length
  const returnedBorrows = borrows.filter(b => b.status === 'returned').length

  const infoItems = [
    { icon: Mail, label: 'Email', value: member.email },
    { icon: Phone, label: 'Phone', value: member.phone || '-' },
    { icon: MapPin, label: 'Address', value: member.address || '-' },
    { icon: Calendar, label: 'Member Since', value: new Date(member.membership_date).toLocaleDateString() },
  ]

  if (isMobile) {
    return (
      <div className="member-detail-mobile">
        <div className="member-detail-header">
          <button className="btn btn-ghost member-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
        </div>

        <div className="member-avatar-section">
          <div className="member-avatar-circle">
            <User size={36} />
          </div>
          <h1 className="member-name">{member.name}</h1>
          <span className="badge badge-success" style={{ fontSize: 12, padding: '3px 10px' }}>Active Member</span>
        </div>

        <div className="member-stats-row">
          <div className="member-stat">
            <span className="member-stat-value">{activeBorrows}</span>
            <span className="member-stat-label">Active</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value">{totalBorrows}</span>
            <span className="member-stat-label">Total</span>
          </div>
          <div className="member-stat">
            <span className="member-stat-value">{returnedBorrows}</span>
            <span className="member-stat-label">Returned</span>
          </div>
        </div>

        <div className="member-info-group">
          {infoItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="member-info-row">
              <div className="member-info-icon"><Icon size={16} /></div>
              <div className="member-info-text">
                <span className="member-info-label">{label}</span>
                <span className="member-info-value">{value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="member-actions">
          <Link to={`/app/members/${member.id}/edit`} className="btn btn-warning" style={{ width: '100%', justifyContent: 'center' }}><Edit size={16} /> Edit Member</Link>
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)} style={{ width: '100%', justifyContent: 'center' }}><Trash2 size={16} /> Delete Member</button>
        </div>

        {borrows.length > 0 && (
          <div className="member-borrow-section">
            <h3 className="member-section-title">Borrow History ({totalBorrows})</h3>
            <div className="borrow-history-scroll">
              <div className="list-cards">
                {borrows.map(b => (
                  <div key={b.id} className="list-card" onClick={() => navigate(`/app/borrows/${b.id}`)}>
                    {b.books?.cover_image ? (
                      <img src={b.books.cover_image} alt="" style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 44, background: 'var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Book size={12} color="var(--text-muted)" />
                      </div>
                    )}
                    <div className="list-card-info">
                      <p className="list-card-title" style={{ fontSize: 12 }}>{b.books?.title}</p>
                      <p className="list-card-sub" style={{ fontSize: 10 }}>
                        {new Date(b.borrow_date).toLocaleDateString()} → {b.return_date ? new Date(b.return_date).toLocaleDateString() : 'Ongoing'}
                      </p>
                    </div>
                    <div className="list-card-meta">
                      <span className={`badge ${b.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                        {b.status}
                      </span>
                      <ArrowRight size={12} color="var(--text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Member"
          message={`Delete "${member.name}"? This will also remove all their borrow records.`}
          confirmText="Delete"
          cancelText="Cancel"
          danger
        />
      </div>
    )
  }

  return (
    <div className="member-detail-page">
      <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="member-detail-top">
        <div className="member-detail-avatar-small">
          {member.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h1 className="member-detail-top-name">{member.name}</h1>
          <span className="badge badge-success">Active Member</span>
        </div>
      </div>

      <div className="member-detail-layout">
        <div className="member-detail-left">
          <div className="detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">Active Borrows</span>
              <span className="detail-stat-value">{activeBorrows}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Total Borrows</span>
              <span className="detail-stat-value">{totalBorrows}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Returned</span>
              <span className="detail-stat-value">{returnedBorrows}</span>
            </div>
          </div>

          <div className="detail-info-grid">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="detail-item">
                <div className="detail-item-header">
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
                <p>{value}</p>
              </div>
            ))}
          </div>

          <div className="detail-actions">
            <Link to={`/app/members/${member.id}/edit`} className="btn btn-warning"><Edit size={16} /> Edit</Link>
            <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={16} /> Delete</button>
          </div>
        </div>

        <div className="member-detail-right">
          {borrows.length > 0 && (
            <div className="member-detail-borrows">
              <h3>Borrow History ({totalBorrows})</h3>
              <div className="borrow-history-scroll">
                <div className="list-cards" style={{ padding: 0 }}>
                  {borrows.map(b => (
                    <div
                      key={b.id}
                      className="list-card"
                      onClick={() => navigate(`/app/borrows/${b.id}`)}
                    >
                      {b.books?.cover_image ? (
                        <img src={b.books.cover_image} alt="" style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 50, background: 'var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Book size={14} color="var(--text-muted)" />
                        </div>
                      )}
                      <div className="list-card-info">
                        <p className="list-card-title">{b.books?.title}</p>
                        <p className="list-card-sub">
                          {new Date(b.borrow_date).toLocaleDateString()} → {b.return_date ? new Date(b.return_date).toLocaleDateString() : 'Ongoing'}
                        </p>
                      </div>
                      <div className="list-card-meta">
                        <span className={`badge ${b.status === 'borrowed' ? 'badge-warning' : 'badge-success'}`}>
                          {b.status}
                        </span>
                        <ArrowRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Member"
        message={`Delete "${member.name}"? This will also remove all their borrow records.`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
      />
    </div>
  )
}
