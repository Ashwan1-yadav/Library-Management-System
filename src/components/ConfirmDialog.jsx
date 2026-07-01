import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal, BottomSheet } from './BottomSheet'

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

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Yes', cancelText = 'No', danger = false }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const Wrapper = isMobile ? BottomSheet : Modal

  return (
    <Wrapper open={open} onClose={onClose} title={title || 'Confirm'}>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: danger ? '#fef2f2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={24} color={danger ? '#dc2626' : '#d97706'} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, padding: '0 8px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: isMobile ? '0 16px' : 0 }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '12px 20px' : undefined, fontSize: isMobile ? 15 : undefined }}
          >
            {cancelText}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-success'}`}
            onClick={() => { onConfirm(); onClose() }}
            style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '12px 20px' : undefined, fontSize: isMobile ? 15 : undefined }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Wrapper>
  )
}
