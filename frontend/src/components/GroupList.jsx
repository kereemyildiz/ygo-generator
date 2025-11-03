/**
 * GroupList Component
 * Displays all groups as a list of expandable cards
 */

import { useEffect } from 'react'
import { Loader2, FolderOpen } from 'lucide-react'
import { useApp } from '../context/AppContext'
import GroupCard from './GroupCard'
import { Alert, AlertDescription, AlertTitle } from './ui/Alert'

const GroupList = () => {
  const { groups, fetchGroups, fetchStatistics, loading } = useApp()

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups()
    fetchStatistics()
  }, [fetchGroups, fetchStatistics])

  // Loading state
  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading groups...</span>
      </div>
    )
  }

  // Empty state
  if (groups.length === 0) {
    return (
      <Alert>
        <FolderOpen className="h-4 w-4" />
        <AlertTitle>Grup Bulunamadı</AlertTitle>
        <AlertDescription>
          Excel dosyaları yükleyin ve "Bağlantıları Analiz Et" butonuna tıklayarak bağlantılı olan maddeleri gruplayın.
        </AlertDescription>
      </Alert>
    )
  }

  // Display groups
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Linked Groups ({groups.length})
        </h2>
      </div>

      {/* Group Cards */}
      <div className="space-y-4">
        {groups.map((group) => (
          <GroupCard key={group.group_id} group={group} />
        ))}
      </div>
    </div>
  )
}

export default GroupList
