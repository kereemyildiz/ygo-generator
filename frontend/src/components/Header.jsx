/**
 * Header Component
 * Application header with title, theme toggle, and statistics
 */

import { FileSpreadsheet, Sun, Moon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from './ui/Button'
import { tr } from '../lib/tr'

const Header = () => {
  const { statistics } = useApp()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{tr.appName}</h1>
              <p className="text-xs text-muted-foreground">{tr.appTagline}</p>
            </div>
          </div>

          {/* Right Side: Statistics + Theme Toggle */}
          <div className="flex items-center space-x-6">
            {/* Statistics */}
            {statistics && (
              <div className="hidden md:flex items-center gap-6 px-4 py-2 rounded-lg bg-muted/50">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{statistics.total_groups}</div>
                  <div className="text-xs text-muted-foreground">Grup</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{statistics.total_items}</div>
                  <div className="text-xs text-muted-foreground">madde</div>
                </div>
                {statistics.total_groups > 0 && (
                  <>
                    <div className="h-8 w-px bg-border" />
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">
                        {statistics.average_items_per_group.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Ort/Grup</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg hover:bg-muted"
              title={isDark ? tr.header.lightMode : tr.header.darkMode}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-orange-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-600" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
