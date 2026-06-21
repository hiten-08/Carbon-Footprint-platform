import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Welcome back</h1>
      <p style={{ color: 'var(--ink-faint)', fontSize: 14, marginBottom: 28 }}>
        Log in to keep tracking your footprint.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />

        {error && <ErrorBanner message={error} />}

        <SubmitButton loading={loading} label="Log in" />
      </form>

      <p style={{ marginTop: 20, fontSize: 13.5, color: 'var(--ink-faint)', textAlign: 'center' }}>
        New here?{' '}
        <Link to="/register" style={{ color: 'var(--moss-deep)', fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(email, displayName, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Create your account</h1>
      <p style={{ color: 'var(--ink-faint)', fontSize: 14, marginBottom: 28 }}>
        Start understanding where your footprint comes from.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Name" value={displayName} onChange={setDisplayName} autoFocus required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          hint="At least 8 characters"
        />

        {error && <ErrorBanner message={error} />}

        <SubmitButton loading={loading} label="Create account" />
      </form>

      <p style={{ marginTop: 20, fontSize: 13.5, color: 'var(--ink-faint)', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--moss-deep)', fontWeight: 600 }}>
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          <Leaf size={22} color="var(--moss)" strokeWidth={2.2} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600 }}>Footing</span>
        </div>
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: 32,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, required, autoFocus, hint }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        minLength={type === 'password' ? 8 : undefined}
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--line)',
          fontSize: 14,
          fontFamily: 'var(--font-body)',
          background: 'var(--paper)',
          color: 'var(--ink)',
        }}
      />
      {hint && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{hint}</span>}
    </label>
  )
}

function SubmitButton({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        marginTop: 6,
        padding: '11px 16px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: loading ? 'var(--ink-faint)' : 'var(--moss-deep)',
        color: 'var(--paper)',
        fontSize: 14,
        fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      {loading ? 'Please wait…' : label}
    </button>
  )
}

function ErrorBanner({ message }) {
  return (
    <div
      role="alert"
      style={{
        background: 'var(--clay-pale)',
        color: '#7A3F1D',
        fontSize: 13,
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {message}
    </div>
  )
}
