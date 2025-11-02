/**
 * Header Component
 * Application header with title, theme toggle, and statistics
 */

import { FileSpreadsheet, Sun, Moon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from './ui/Button'

const Header = () => {
  const { statistics } = useApp()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">SRS Link Manager</h1>
              <p className="text-sm opacity-90">Linked Requirements Document Manager</p>
            </div>
          </div>

          {/* Right Side: Theme Toggle + Statistics */}
          <div className="flex items-center space-x-6">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Statistics */}
            {statistics && (
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.total_groups}</div>
                  <div className="text-xs opacity-90">Groups</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.total_items}</div>
                  <div className="text-xs opacity-90">Items</div>
                </div>
                {statistics.total_groups > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {statistics.average_items_per_group.toFixed(1)}
                    </div>
                    <div className="text-xs opacity-90">Avg per Group</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
