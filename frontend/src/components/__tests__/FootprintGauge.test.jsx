import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FootprintGauge } from '../components/FootprintGauge'

describe('FootprintGauge', () => {
  it('renders the kg CO2e value', () => {
    render(<FootprintGauge todayKg={12.34} averageKg={43.8} />)
    expect(screen.getByText('12.3')).toBeInTheDocument()
  })

  it('shows "below" message when under the average', () => {
    render(<FootprintGauge todayKg={10} averageKg={40} />)
    expect(screen.getByText(/below US daily average/)).toBeInTheDocument()
  })

  it('shows "above" message when over the average', () => {
    render(<FootprintGauge todayKg={60} averageKg={40} />)
    expect(screen.getByText(/above US daily average/)).toBeInTheDocument()
  })

  it('has an accessible label describing the comparison', () => {
    render(<FootprintGauge todayKg={20} averageKg={40} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', expect.stringContaining('below'))
  })

  it('handles a zero average without throwing', () => {
    expect(() => render(<FootprintGauge todayKg={5} averageKg={0} />)).not.toThrow()
  })
})
