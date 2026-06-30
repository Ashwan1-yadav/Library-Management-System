import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Library, LogIn, UserPlus } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expired, setExpired] = useState(location.state?.expired || false)
  const [isSignUp, setIsSignUp] = useState(location.state?.signUp || false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setExpired(false)
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        setSuccess('Account created! Please login.')
        setIsSignUp(false)
      } else {
        await signIn(email, password)
        navigate('/app')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); setExpired(false) }

  return (
    <div className="login-page">
      <div className="login-illustrations">
        <div className="login-blob blob-1" />
        <div className="login-blob blob-2" />
        <div className="login-blob blob-3" />
        <div className="login-grid-bg" />
        <div className="login-float float-1"><div className="float-shape shape-1" /></div>
        <div className="login-float float-2"><div className="float-shape shape-2" /></div>
        <div className="login-float float-3"><div className="float-shape shape-3" /></div>
      </div>

      <div className="login-split">
        <div className="login-form-side">
          <div className="login-form-card">
            <Link to="/" className="login-card-logo">
              <div className="login-card-logo-icon"><Library size={22} /></div>
              <span>LibraSys</span>
            </Link>
            <div className="login-form-header">
              <h3>{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
              <p>{isSignUp ? 'Register to get started.' : 'Sign in to your account.'}</p>
            </div>
            {expired && <div className="error-msg">Session expired! Please login.</div>}
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Please wait...' : isSignUp ? <><UserPlus size={16} /> Create Account</> : <><LogIn size={16} /> Sign In</>}
              </button>
            </form>
            <div className="login-form-footer">
              <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
              <button type="button" className="login-toggle-btn" onClick={toggleMode}>
                {isSignUp ? 'Sign In' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
