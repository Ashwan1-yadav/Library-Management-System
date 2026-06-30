import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setCurrentY(0)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleTouchStart = (e) => {
    if (e.target.closest('.sheet-content')) return
    setStartY(e.touches[0].clientY)
    setDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!dragging) return
    const diff = e.touches[0].clientY - startY
    if (diff > 0) setCurrentY(diff)
  }

  const handleTouchEnd = () => {
    setDragging(false)
    if (currentY > 100) onClose()
    setCurrentY(0)
  }

  if (!open) return null

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div
        ref={sheetRef}
        className="sheet"
        style={{ transform: dragging ? `translateY(${currentY}px)` : 'translateY(0)', transition: dragging ? 'none' : undefined }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sheet-handle" />
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 8px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
            <button onClick={onClose} className="btn-ghost" style={{ padding: 8, border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className="sheet-content">{children}</div>
      </div>
    </>
  )
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <button onClick={onClose} className="btn-ghost" style={{ padding: 8, border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
