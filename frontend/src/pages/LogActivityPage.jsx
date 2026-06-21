import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { api, ApiError } from '../api/client'
import { ActivityIcon } from '../components/ActivityIcon'

const CATEGORY_LABELS = { transport: 'Transport', energy: 'Home Energy', food: 'Food', waste: 'Waste' }
const CATEGORY_ORDER = ['transport', 'energy', 'food', 'waste']

function todayISO() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function LogActivityPage() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    api.listActivities().then(setActivities).catch((err) => setError(err.message))
  }, [])

  const grouped = useMemo(() => {
    const g = {}
    for (const cat of CATEGORY_ORDER) g[cat] = []
    for (const a of activities) {
      if (!g[a.category]) g[a.category] = []
      g[a.category].push(a)
    }
    return g
  }, [activities])

  const estimatedCo2e = selected && quantity
    ? (parseFloat(quantity) || 0) * selected.kg_co2e_per_unit
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected || !quantity) return
    setError(null)
    setSubmitting(true)
    try {
      await api.createEntry({
        activity: selected.key,
        quantity: parseFloat(quantity),
        logged_for_date: date,
        note: note || null,
      })
      setJustSaved(true)
      setQuantity('')
      setNote('')
      setTimeout(() => setJustSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save that entry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 680 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>Log an activity</h1>
        <p style={{ color: 'var(--ink-faint)', fontSize: 14, marginTop: 6 }}>
          Pick what you did, enter the amount, and we'll calculate the impact.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {CATEGORY_ORDER.map((cat) => (
          grouped[cat]?.length ? (
            <div key={cat}>
              <p style={sectionLabelStyle}>{CATEGORY_LABELS[cat]}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {grouped[cat].map((a) => (
                  <button
                    type="button"
                    key={a.key}
                    onClick={() => setSelected(a)}
                    style={{
                      ...activityTileStyle,
                      borderColor: selected?.key === a.key ? 'var(--moss-deep)' : 'var(--line)',
                      background: selected?.key === a.key ? 'var(--moss-pale)' : 'var(--surface-raised)',
                    }}
                  >
                    <ActivityIcon name={a.icon} size={18} color={selected?.key === a.key ? 'var(--moss-deep)' : 'var(--ink-soft)'} />
                    <span style={{ fontSize: 12.5, lineHeight: 1.35, textAlign: 'left' }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null
        ))}

        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={fieldLabelStyle}>Amount ({selected.unit}{selected.unit !== '1' ? 's' : ''})</span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  autoFocus
                  style={inputStyle}
                />
              </label>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={fieldLabelStyle}>Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={todayISO()}
                  required
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={fieldLabelStyle}>Note (optional)</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. commute to work"
                maxLength={280}
                style={inputStyle}
              />
            </label>

            {estimatedCo2e != null && (
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                Estimated impact:{' '}
                <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {estimatedCo2e.toFixed(2)} kg CO2e
                </span>
              </p>
            )}

            {selected.notes && (
              <p style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>{selected.notes}</p>
            )}
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="submit"
            disabled={!selected || !quantity || submitting}
            style={{
              ...primaryButtonStyle,
              opacity: !selected || !quantity || submitting ? 0.5 : 1,
              cursor: !selected || !quantity || submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'Saving…' : 'Save entry'}
          </button>
          {justSaved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--moss-deep)', fontWeight: 600 }}>
              <Check size={15} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 13.5, cursor: 'pointer', marginLeft: 'auto' }}
          >
            Back to dashboard
          </button>
        </div>
      </form>
    </div>
  )
}

const sectionLabelStyle = {
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--ink-faint)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 10,
}

const fieldLabelStyle = { fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }

const activityTileStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  padding: '12px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--line)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color 0.15s ease, background 0.15s ease',
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  background: 'var(--paper)',
  color: 'var(--ink)',
}

const primaryButtonStyle = {
  padding: '11px 22px',
  background: 'var(--moss-deep)',
  color: 'var(--paper)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
}

function ErrorBanner({ message }) {
  return (
    <div role="alert" style={{ background: 'var(--clay-pale)', color: '#7A3F1D', fontSize: 13, padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
      {message}
    </div>
  )
}
