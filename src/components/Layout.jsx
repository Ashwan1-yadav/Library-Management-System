import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Book, Users, ArrowLeftRight, DollarSign, BarChart3, LayoutDashboard, LogOut, Library, Bell, ChevronDown, UserCircle, AlertTriangle, Sun, Moon, Menu, X, MoreHorizontal } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const desktopNavItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/books', icon: Book, label: 'Books' },
  { to: '/app/members', icon: Users, label: 'Members' },
  { to: '/app/borrow-return', icon: ArrowLeftRight, label: 'Borrow & Return' },
  { to: '/app/fines', icon: DollarSign, label: 'Fines' },
  { to: '/app/reports', icon: BarChart3, label: 'Reports' },
]

const bottomTabItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/app/books', icon: Book, label: 'Books' },
  { to: '/app/members', icon: Users, label: 'Members' },
  { to: '/app/borrow-return', icon: ArrowLeftRight, label: 'Borrow' },
]

const pageTitles = {
  '/app': 'Dashboard',
  '/app/books': 'Books',
  '/app/books/new': 'Add Book',
  '/app/members': 'Members',
  '/app/members/new': 'Add Member',
  '/app/borrow-return': 'Borrow & Return',
  '/app/fines': 'Fines',
  '/app/reports': 'Reports',
  '/app/profile': 'Admin Profile',
}

function getInitialTheme() {
  const stored = localStorage.getItem('theme')
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function MobileMoreMenu({ onClose, onNavigate, onLogout }) {
  const items = [
    { to: '/app/fines', icon: DollarSign, label: 'Fines' },
    { to: '/app/reports', icon: BarChart3, label: 'Reports' },
    { to: '/app/profile', icon: UserCircle, label: 'My Profile' },
  ]

  return (
    <>
      <div className="mobile-more-backdrop" onClick={onClose} />
      <div className="mobile-more-sheet">
        <div className="mobile-more-handle" />
        <div className="mobile-more-items">
          {items.map(({ to, icon: Icon, label }) => (
            <button key={to} className="mobile-more-item" onClick={() => { onNavigate(to); onClose() }}>
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
          <div className="mobile-more-divider" />
          <button className="mobile-more-item mobile-more-signout" onClick={onLogout}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

const tabRoutes = [
  '/app',
  '/app/books',
  '/app/members',
  '/app/borrow-return',
]

export default function Layout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [theme, setTheme] = useState(getInitialTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const notifRef = useRef()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)
  const isSwiping = useRef(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.content = theme === 'dark' ? '#111827' : '#f5f0e8'
  }, [theme])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
    setShowMore(false)
  }, [location.pathname])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
    isSwiping.current = false
  }

  const handleTouchMove = (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (dx > 10 && dx > dy) {
      isSwiping.current = true
    }
  }

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const elapsed = Date.now() - touchStartTime.current
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && elapsed < 400) {
      const currentIdx = tabRoutes.indexOf(location.pathname)
      if (dx < 0 && currentIdx < tabRoutes.length - 1) {
        navigate(tabRoutes[currentIdx + 1])
      } else if (dx > 0 && currentIdx > 0) {
        navigate(tabRoutes[currentIdx - 1])
      }
    }
  }

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('fines')
      .select('amount, member_id, members(name)')
      .eq('paid', false)
      .eq('admin_id', user.id)

    if (!data) return

    const grouped = {}
    data.forEach((f) => {
      const mid = f.member_id
      if (!grouped[mid]) grouped[mid] = { name: f.members?.name || 'Unknown', total: 0 }
      grouped[mid].total += parseFloat(f.amount || 0)
    })

    const highFines = Object.values(grouped).filter((m) => m.total > 50)
    setNotifications(highFines)
  }

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const handleLogout = async () => {
    try {
      setShowMore(false)
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const basePath = '/' + location.pathname.split('/').filter(Boolean).slice(0, 2).join('/')
  const pageTitle = pageTitles[location.pathname] || pageTitles[basePath] || ''

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon"><Library size={22} /></div>
            <div className="logo-text">
              <span className="logo-title">LibraSys</span>
              <span className="logo-sub">Library Manager</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="sidebar-nav">
          {desktopNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink to={to} end={end} key={to}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{profile?.name || user?.email?.split('@')[0] || 'Admin'}</span>
              <span className="sidebar-user-role">Administrator</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="navbar">
          <div className="navbar-left">
            <button className="navbar-icon-btn hamburger" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <h2 className="navbar-title">{pageTitle}</h2>
          </div>
          <div className="navbar-right">
            <button className="navbar-icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="navbar-notif" ref={notifRef}>
              <button className="navbar-icon-btn" onClick={() => setShowNotif(!showNotif)}>
                <Bell size={18} />
                {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Alerts</span>
                    <span className="notif-count">{notifications.length}</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No alerts</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="notif-item">
                        <AlertTriangle size={16} className="notif-icon" />
                        <div className="notif-text">
                          <strong>{n.name}</strong> has ₹{n.total.toFixed(2)} in unpaid fines
                        </div>
                      </div>
                    ))
                  )}
                  <div className="notif-footer">
                    <button className="btn btn-ghost btn-sm btn-block" onClick={() => navigate('/app/fines')}>View All Fines</button>
                  </div>
                </div>
              )}
            </div>
            <div className="navbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="navbar-avatar-img" />
              ) : (
                <div className="navbar-avatar">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <div className="navbar-user-info">
                <span className="navbar-user-name">{profile?.name || user?.email?.split('@')[0] || 'Admin'}</span>
              </div>
              <ChevronDown size={14} />
              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <span className="user-menu-email">{user?.email}</span>
                  </div>
                  <hr />
                  <NavLink to="/app/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                    <UserCircle size={14} /> My Profile
                  </NavLink>
                  <button className="user-menu-item danger" onClick={handleLogout}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main
          className="main-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
        {!sidebarOpen && (
          <nav className="bottom-tabs">
            {bottomTabItems.map(({ to, icon: Icon, label }) => (
              <NavLink to={to} end key={to} className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
                <Icon size={22} />
                <span>{label}</span>
              </NavLink>
            ))}
            <button className={`bottom-tab ${['/app/fines', '/app/reports', '/app/profile'].includes(location.pathname) ? 'active' : ''}`} onClick={() => setShowMore(true)}>
              <MoreHorizontal size={22} />
              <span>More</span>
            </button>
          </nav>
        )}
      </div>
      {showMore && <MobileMoreMenu onClose={() => setShowMore(false)} onNavigate={navigate} onLogout={handleLogout} />}
    </div>
  )
}
