import { Plus } from 'lucide-react'

export default function Fab({ icon: Icon = Plus, onClick, label }) {
  return (
    <button className="fab" onClick={onClick} aria-label={label || 'Add'}>
      <Icon size={24} />
    </button>
  )
}
