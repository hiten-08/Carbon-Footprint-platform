import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Lightbulb, ArrowRight, Plus } from 'lucide-react'
import { api } from '../api/client'
import { FootprintGauge } from '../components/FootprintGauge'

const CATEGORY_COLORS = {
  transport: '#4F7B52',
  energy: '#BC6B3D',
  food: '#6E93A3',
  waste: '#9A7B4F',
}

export function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.getSummary(30)
      .then((data) => { if (!cancelled) setSummary(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <CenteredNote>Loading your dashboard…</CenteredNote>
  if (error) return <CenteredNote tone="error">Couldn't load your dashboard: {error}</CenteredNote>
  if (!summary) return null

  const lastTrendPoint = summary.trend.length ? summary.trend[summary.trend.length - 1] : null
  const mostRecentKg = lastTrendPoint ? lastTrendPoint.total_kg_co2e : 0
  const mostRecentIsToday = lastTrendPoint
    ? lastTrendPoint.date === new Date().toISOString().slice(0, 10)
    : false
  const hasData = summary.entry_count > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Last 30 days
          </p>
          <h1 style={{ fontSize: 30 }}>Your footprint, at a glance</h1>
        </div>
        <Link to="/log" style={primaryButtonStyle}>
          <Plus size={16} />
          Log activity
        </Link>
      </div>

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
            <Card>
              <CardLabel>{mostRecentIsToday ? 'Today vs. US average' : 'Most recent day vs. US average'}</CardLabel>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <FootprintGauge todayKg={mostRecentKg} averageKg={summary.us_average_daily_kg_co2e} size={170} />
              </div>
            </Card>

            <Card>
              <CardLabel>Where it comes from</CardLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={summary.breakdown}
                        dataKey="total_kg_co2e"
                        nameKey="label"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {summary.breakdown.map((entry) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#999'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value.toFixed(1)} kg CO2e`, name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--line)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {summary.breakdown.map((b) => (
                    <div key={b.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[b.category] || '#999', flexShrink: 0 }} />
                      <span style={{ fontSize: 13.5, flex: 1 }}>{b.label}</span>
                      <span className="mono" style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{b.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardLabel>Daily trend</CardLabel>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={summary.trend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--ink-faint)' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    axisLine={{ stroke: 'var(--line)' }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [`${value.toFixed(1)} kg CO2e`, 'Total']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--line)' }}
                  />
                  <Line type="monotone" dataKey="total_kg_co2e" stroke="var(--moss-deep)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      <div>
        <CardLabel>Personalized insights</CardLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {summary.insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  )
}

function InsightCard({ insight }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: '16px 18px',
        background: 'var(--surface-raised)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <Lightbulb size={18} color="var(--moss-deep)" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{insight.title}</p>
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{insight.detail}</p>
      </div>
      {insight.potential_savings_kg != null && (
        <div className="mono" style={{ flexShrink: 0, fontSize: 13, color: 'var(--moss-deep)', fontWeight: 600, alignSelf: 'center' }}>
          −{insight.potential_savings_kg.toFixed(1)} kg
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>
          No entries yet
        </p>
        <p style={{ fontSize: 14, color: 'var(--ink-faint)', maxWidth: 360, margin: '0 auto 20px' }}>
          Log your first activity — a commute, a meal, your electricity use — and your footprint will start taking shape here.
        </p>
        <Link to="/log" style={primaryButtonStyle}>
          Log your first activity
          <ArrowRight size={16} />
        </Link>
      </div>
    </Card>
  )
}

function Card({ children }) {
  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: 22,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </div>
  )
}

function CardLabel({ children }) {
  return (
    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
      {children}
    </p>
  )
}

function CenteredNote({ children, tone }) {
  return (
    <div style={{ padding: '80px 0', textAlign: 'center', color: tone === 'error' ? 'var(--clay)' : 'var(--ink-faint)', fontSize: 14 }}>
      {children}
    </div>
  )
}

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 18px',
  background: 'var(--moss-deep)',
  color: 'var(--paper)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  border: 'none',
}
