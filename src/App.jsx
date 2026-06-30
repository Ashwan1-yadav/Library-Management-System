import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Books from './pages/Books'
import BookDetail from './pages/BookDetail'
import BookForm from './pages/BookForm'
import Members from './pages/Members'
import MemberForm from './pages/MemberForm'
import BorrowReturn from './pages/BorrowReturn'
import Fines from './pages/Fines'
import Reports from './pages/Reports'
import AdminProfile from './pages/AdminProfile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="books/new" element={<BookForm />} />
            <Route path="books/:id" element={<BookDetail />} />
            <Route path="books/:id/edit" element={<BookForm />} />
            <Route path="members" element={<Members />} />
            <Route path="members/new" element={<MemberForm />} />
            <Route path="members/:id/edit" element={<MemberForm />} />
            <Route path="borrow-return" element={<BorrowReturn />} />
            <Route path="fines" element={<Fines />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
