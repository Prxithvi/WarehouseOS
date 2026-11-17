// Concrete hex palette for Recharts series (CSS variables can't be used as
// raw fill/stroke values). These tones read well on both dark and light themes.
export const CHART_COLORS = [
  '#8B5CF6', // accent
  '#22C55E', // success
  '#F59E0B', // warning
  '#3B82F6', // info
  '#EF4444', // danger
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#84CC16', // lime
  '#F97316', // orange
  '#A855F7', // purple
]

export const colorAt = (i) => CHART_COLORS[i % CHART_COLORS.length]

// Recharts tooltip style object (concrete colors for the floating tooltip).
export const tooltipStyle = {
  contentStyle: {
    background: 'rgb(21 28 44 / 0.95)',
    border: '1px solid #273449',
    borderRadius: 8,
    color: '#F8FAFC',
    fontSize: 12,
  },
  labelStyle: { color: '#F8FAFC', marginBottom: 4 },
  itemStyle: { color: '#F8FAFC' },
}
