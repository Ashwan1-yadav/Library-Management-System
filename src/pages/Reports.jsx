import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download } from 'lucide-react'
import { useToast } from '../components/Toast'

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#059669', '#d97706', '#7c3aed']

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

function downloadCSV(data, filename, columns) {
  const header = columns.join(',')
  const rows = data.map(row => columns.map(c => `"${row[c] ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([header + '\n' + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [genreData, setGenreData] = useState([])
  const [monthlyBorrows, setMonthlyBorrows] = useState([])
  const [topBooks, setTopBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadGenreData(), loadMonthlyBorrows(), loadTopBooks()])
    setLoading(false)
  }

  const loadGenreData = async () => {
    const { data } = await supabase.from('books').select('genre').eq('admin_id', user.id)
    if (!data) return
    const counts = {}
    data.forEach((b) => {
      const g = b.genre || 'Uncategorized'
      counts[g] = (counts[g] || 0) + 1
    })
    setGenreData(Object.entries(counts).map(([name, value]) => ({ name, value })))
  }

  const loadMonthlyBorrows = async () => {
    const { data } = await supabase.from('borrows').select('borrow_date').eq('admin_id', user.id)
    if (!data) return
    const counts = {}
    data.forEach((b) => {
      const month = new Date(b.borrow_date).toLocaleString('default', { month: 'short', year: 'numeric' })
      counts[month] = (counts[month] || 0) + 1
    })
    const sorted = Object.entries(counts)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([name, count]) => ({ name, count }))
    setMonthlyBorrows(sorted)
  }

  const loadTopBooks = async () => {
    const { data } = await supabase
      .from('borrows')
      .select('books(title)')
      .eq('admin_id', user.id)
    if (!data) return
    const counts = {}
    data.forEach((b) => {
      const title = b.books?.title || 'Unknown'
      counts[title] = (counts[title] || 0) + 1
    })
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
    setTopBooks(sorted)
  }

  const handleExport = (data, filename, columns) => {
    downloadCSV(data, filename, columns)
    toast.success('Report exported as CSV')
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
      </div>
      {loading ? (
        <div className="list-cards">
          {[1,2,3].map(i => (
            <div key={i} className="list-card" style={{ pointerEvents: 'none' }}>
              <div style={{ flex: 1 }}>
                <div className="skeleton-bar" style={{ width: '50%', marginBottom: 8 }} />
                <div className="skeleton-chart" style={{ height: 200 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="reports-list">
            <div className="card">
              <div className="report-header">
                <h2>Books by Genre</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => handleExport(genreData, 'books-by-genre.csv', ['name', 'value'])}>
                  <Download size={14} /> CSV
                </button>
              </div>
              <div style={{ padding: isMobile ? '0 8px 0' : '0' }}>
                {isMobile ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                        {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                            {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginTop: 8 }}>
                      {genreData.map((item, i) => {
                        const total = genreData.reduce((s, g) => s + g.value, 0)
                        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                        return (
                          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.value} ({pct}%)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="card">
              <div className="report-header">
                <h2>Monthly Borrows</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => handleExport(monthlyBorrows, 'monthly-borrows.csv', ['name', 'count'])}>
                  <Download size={14} /> CSV
                </button>
              </div>
              <div style={{ padding: isMobile ? '0 8px 0' : '0' }}>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <BarChart data={monthlyBorrows} margin={isMobile ? { top: 8, right: 4, left: -16, bottom: 4 } : { top: 8, right: 8, left: -8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis dataKey="name" tick={{ fontSize: isMobile ? 9 : 11, fill: 'var(--text-muted)' }} interval={isMobile ? 1 : 0} />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12, fill: 'var(--text-muted)' }} width={isMobile ? 30 : 40} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="report-header">
                <h2>Top 5 Most Borrowed</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => handleExport(topBooks, 'top-borrowed-books.csv', ['name', 'count'])}>
                  <Download size={14} /> CSV
                </button>
              </div>
              <div style={{ padding: isMobile ? '0 8px 0' : '0' }}>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <BarChart data={topBooks} layout="vertical" margin={isMobile ? { top: 8, right: 4, left: 0, bottom: 4 } : { top: 8, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12, fill: 'var(--text-muted)' }} />
                    <YAxis type="category" dataKey="name" width={isMobile ? 90 : 180} tick={{ fontSize: isMobile ? 9 : 12, fill: 'var(--text-muted)' }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#059669" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
