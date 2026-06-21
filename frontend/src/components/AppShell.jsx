import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Leaf } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const navLinkStyle = ({ isActive }) => ({
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 500,
  color: isActive ? 'var(--ink)' : 'var(--ink-faint)',
  textDecoration: 'none',
  padding: '8px 4px',
  borderBottom: isActive ? '2px solid var(--moss)' : '2px solid transparent',
  transition: 'color 0.15s ease',
})

export function AppShell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Leaf size={20} color="var(--moss)" strokeWidth={2.2} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600 }}>
                Footing
              </span>
            </div>
            <nav style={{ display: 'flex', gap: 24 }}>
              <NavLink to="/" end style={navLinkStyle}>Dashboard</NavLink>
              <NavLink to="/log" style={navLinkStyle}>Log activity</NavLink>
              <NavLink to="/history" style={navLinkStyle}>History</NavLink>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{user.display_name}</span>
            )}
            <button
              onClick={handleLogout}
              aria-label="Log out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-faint)',
                cursor: 'pointer',
                fontSize: 13,
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-faint)')}
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1040, margin: '0 auto', width: '100%', padding: '40px 24px 80px' }}>
        {children}
      </main>
    </div>
  )
}
