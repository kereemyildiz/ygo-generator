/**
 * Header Component
 * Application header with title and statistics
 */

import { FileSpreadsheet } from 'lucide-react'
import { useApp } from '../context/AppContext'

const Header = () => {
  const { statistics } = useApp()

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
    </header>
  )
}

export default Header
