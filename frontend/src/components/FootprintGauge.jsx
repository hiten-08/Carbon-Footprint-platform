/**
 * The signature visual of the product: two footprint shapes (echoing the
 * challenge brief's own forest-footprint imagery) that fill from the heel
 * up with moss green, proportional to today's logged emissions relative
 * to the US daily average. Under the average -> fills mostly moss green.
 * Over -> the fill shifts toward clay as a gentle, non-alarmist cue.
 */
export function FootprintGauge({ todayKg, averageKg, size = 200 }) {
  const ratio = averageKg > 0 ? todayKg / averageKg : 0
  const fillPercent = Math.min(Math.max(ratio, 0), 1.4) // cap visual overflow at 140%
  const fillHeight = Math.min(fillPercent, 1) * 100

  const overAverage = ratio > 1
  const fillColor = overAverage ? 'var(--clay)' : 'var(--moss)'
  const clipId = 'footprint-fill-clip'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Today's footprint: ${todayKg.toFixed(1)} kilograms CO2 equivalent, ${overAverage ? 'above' : 'below'} the US daily average of ${averageKg.toFixed(1)} kilograms`}
      >
        <defs>
          <clipPath id={clipId}>
            {/* Two simplified footprint shapes (left + right foot) */}
            <path d="M70,150 C55,150 48,135 50,118 C52,100 62,90 60,72 C58,55 50,45 55,32 C60,18 75,15 82,28 C88,40 84,55 88,70 C92,86 100,95 98,115 C96,135 88,150 70,150 Z" />
            <path d="M135,165 C118,165 110,148 113,128 C116,108 128,96 125,76 C122,57 113,46 119,30 C125,15 142,12 150,27 C157,40 152,57 157,75 C162,93 172,103 169,126 C166,148 155,165 135,165 Z" />
          </clipPath>
        </defs>

        {/* Outline (always visible, faint) */}
        <g fill="none" stroke="var(--line)" strokeWidth="2">
          <path d="M70,150 C55,150 48,135 50,118 C52,100 62,90 60,72 C58,55 50,45 55,32 C60,18 75,15 82,28 C88,40 84,55 88,70 C92,86 100,95 98,115 C96,135 88,150 70,150 Z" />
          <path d="M135,165 C118,165 110,148 113,128 C116,108 128,96 125,76 C122,57 113,46 119,30 C125,15 142,12 150,27 C157,40 152,57 157,75 C162,93 172,103 169,126 C166,148 155,165 135,165 Z" />
        </g>

        {/* Fill, clipped to footprint shapes, rising from the bottom */}
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y={200 - (fillHeight / 100) * 180 - 10}
            width="200"
            height="200"
            fill={fillColor}
            style={{ transition: 'y 0.8s cubic-bezier(0.22, 1, 0.36, 1), fill 0.4s ease' }}
          />
        </g>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink)' }}>
          {todayKg.toFixed(1)}
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-faint)', marginLeft: 4 }}>kg CO2e</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 2 }}>
          {overAverage ? (
            <span>{Math.round((ratio - 1) * 100)}% above US daily average</span>
          ) : (
            <span>{Math.round((1 - ratio) * 100)}% below US daily average</span>
          )}
        </div>
      </div>
    </div>
  )
}
