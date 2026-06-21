import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api } from '../api/client'
import { ActivityIcon } from '../components/ActivityIcon'

// We need icon names per activity; reuse the activities catalog to map
// activity key -> icon, since /entries doesn't echo the icon back.
export function HistoryPage() {
  const [entries, setEntries] = useState([])
  const [iconByActivity, setIconByActivity] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.listEntries(), api.listActivities()])
      .then(([entriesData, activitiesData]) => {
        if (cancelled) return
        setEntries(entriesData)
        const map = {}
        for (const a of activitiesData) map[a.key] = a.icon
        setIconByActivity(map)
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await api.deleteEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <CenteredNote>Loading history…</CenteredNote>
  if (error) return <CenteredNote tone="error">{error}</CenteredNote>

  const groupedByDate = groupByDate(entries)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>History</h1>
        <p style={{ color: 'var(--ink-faint)', fontSize: 14, marginTop: 6 }}>
          Everything you've logged, most recent first.
        </p>
      </div>

      {entries.length === 0 ? (
        <CenteredNote>No entries logged yet.</CenteredNote>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(groupedByDate).map(([date, dayEntries]) => (
            <div key={date}>
              <p style={dateHeaderStyle}>
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dayEntries.map((entry) => (
                  <div key={entry.id} style={rowStyle}>
                    <ActivityIcon name={iconByActivity[entry.activity]} size={17} color="var(--ink-soft)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{entry.activity_label}</p>
                      <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                        {entry.quantity} {entry.unit}{entry.quantity !== 1 ? 's' : ''}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </p>
                    </div>
                    <span className="mono" style={{ fontSize: 13, color: entry.co2e_kg < 0 ? 'var(--moss-deep)' : 'var(--ink-soft)', fontWeight: 600, flexShrink: 0 }}>
                      {entry.co2e_kg >= 0 ? '+' : ''}{entry.co2e_kg.toFixed(2)} kg
                    </span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      aria-label={`Delete entry: ${entry.activity_label}`}
                      style={deleteButtonStyle}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByDate(entries) {
  const groups = {}
  for (const e of entries) {
    const key = e.logged_for_date
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

const dateHeaderStyle = {
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--ink-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 8,
  paddingBottom: 6,
  borderBottom: '1px solid var(--line)',
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '12px 4px',
  borderBottom: '1px solid var(--line)',
}

const deleteButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--ink-faint)',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 'var(--radius-sm)',
  flexShrink: 0,
}

function CenteredNote({ children, tone }) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center', color: tone === 'error' ? 'var(--clay)' : 'var(--ink-faint)', fontSize: 14 }}>
      {children}
    </div>
  )
}
