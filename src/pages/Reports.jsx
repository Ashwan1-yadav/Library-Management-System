import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download } from 'lucide-react'

const COLORS = ['#4a6cf7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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
  const [genreData, setGenreData] = useState([])
  const [monthlyBorrows, setMonthlyBorrows] = useState([])
  const [topBooks, setTopBooks] = useState([])

  useEffect(() => {
    loadGenreData()
    loadMonthlyBorrows()
    loadTopBooks()
  }, [])

  const loadGenreData = async () => {
    const { data } = await supabase.from('books').select('genre')
    if (!data) return
    const counts = {}
    data.forEach((b) => {
      const g = b.genre || 'Uncategorized'
      counts[g] = (counts[g] || 0) + 1
    })
    setGenreData(Object.entries(counts).map(([name, value]) => ({ name, value })))
  }

  const loadMonthlyBorrows = async () => {
    const { data } = await supabase.from('borrows').select('borrow_date')
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

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
      </div>
      <div className="reports-grid">
        <div className="card">
          <div className="report-header">
            <h2>Books by Genre</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(genreData, 'books-by-genre.csv', ['name', 'value'])}>
              <Download size={14} /> CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="report-header">
            <h2>Monthly Borrows</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(monthlyBorrows, 'monthly-borrows.csv', ['name', 'count'])}>
              <Download size={14} /> CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyBorrows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4a6cf7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <div className="report-header">
          <h2>Top 5 Most Borrowed Books</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadCSV(topBooks, 'top-borrowed-books.csv', ['name', 'count'])}>
            <Download size={14} /> CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topBooks} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={200} />
            <Tooltip />
            <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
