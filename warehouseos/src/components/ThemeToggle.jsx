import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { classNames } from '../lib/format'

export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={classNames('os-btn-ghost p-2 rounded-lg', className)}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
