/**
 * GroupList Component
 * Displays all groups as a list of expandable cards with batch selection
 */

import { useEffect, useState } from 'react'
import { Loader2, FolderOpen, Sparkles, CheckSquare, Square, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import GroupCard from './GroupCard'
import { Alert, AlertDescription, AlertTitle } from './ui/Alert'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { generateYGOBatch } from '../lib/api'

const GroupList = () => {
  const { groups, fetchGroups, fetchStatistics, loadingGroups, trackYGOJob } = useApp()
  const toast = useToast()
  const [selectedGroups, setSelectedGroups] = useState(new Set())

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups()
    fetchStatistics()
  }, [fetchGroups, fetchStatistics])

  // Toggle group selection
  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  // Select all groups
  const selectAllGroups = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set())
    } else {
      setSelectedGroups(new Set(groups.map(g => g.group_id)))
    }
  }

  // Handle batch YGÖ generation (non-blocking)
  const handleBatchGenerateYGO = async () => {
    if (selectedGroups.size === 0) {
      toast.error('Lütfen en az bir grup seçin')
      return
    }

    try {
      const groupIds = Array.from(selectedGroups)

      console.log('🚀 Batch YGÖ Generation Started:', {
        groupIds,
        groupCount: groupIds.length,
        timestamp: new Date().toISOString()
      })

      const response = await generateYGOBatch(groupIds)

      console.log('✅ Batch YGÖ Request Accepted:', {
        jobId: response.job_id,
        message: response.message,
        timestamp: new Date().toISOString()
      })

      // Track job in global state (non-blocking!)
      trackYGOJob(response.job_id, {
        groupIds: groupIds,
        groupName: `Toplu YGÖ (${groupIds.length} grup)`,
        itemCount: groupIds.length,
        status: 'pending',
        progress: 0,
        isBatch: true
      })

      // Clear selection after starting
      setSelectedGroups(new Set())

      toast.success(`${response.message} - Arka planda çalışmaya devam edebilirsiniz`)
    } catch (err) {
      console.error('❌ Batch YGÖ Generation Failed:', {
        error: err,
        errorMessage: err.response?.data?.detail || err.message,
        groupIds: Array.from(selectedGroups),
        timestamp: new Date().toISOString()
      })
      toast.error(err.response?.data?.detail || 'Toplu YGÖ üretimi başlatılamadı')
    }
  }

  // Loading state
  if (loadingGroups && groups.length === 0) {
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
    <div className="space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          Gruplar ({groups.length})
        </h2>

        {/* Select All Toggle */}
        <Button
          size="sm"
          variant={selectedGroups.size > 0 ? "default" : "outline"}
          onClick={selectAllGroups}
          className="gap-2"
        >
          {selectedGroups.size === groups.length ? (
            <>
              <CheckSquare className="h-4 w-4" />
              Seçimi Kaldır ({selectedGroups.size})
            </>
          ) : selectedGroups.size > 0 ? (
            <>
              <Square className="h-4 w-4" />
              Tümünü Seç ({selectedGroups.size}/{groups.length})
            </>
          ) : (
            <>
              <Square className="h-4 w-4" />
              Toplu Seçim
            </>
          )}
        </Button>
      </div>

      {/* Floating Batch Action Toolbar (appears when groups selected) */}
      {selectedGroups.size > 0 && (
        <div className="sticky top-4 z-20 mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-xl border-2 border-purple-400 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  <span className="font-semibold">
                    {selectedGroups.size} grup seçildi
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedGroups(new Set())}
                  className="text-white hover:bg-white/20 h-7 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Button
                size="default"
                onClick={handleBatchGenerateYGO}
                className="bg-white text-purple-700 hover:bg-purple-50 font-semibold shadow-lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Toplu YGÖ Üret ({selectedGroups.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Cards */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.group_id} className="relative">
            {/* Selection Checkbox */}
            <div className="absolute left-4 top-6 z-10">
              <button
                onClick={() => toggleGroupSelection(group.group_id)}
                className="p-1 hover:bg-accent rounded transition-colors"
                title={selectedGroups.has(group.group_id) ? 'Seçimi kaldır' : 'Grubu seç'}
              >
                {selectedGroups.has(group.group_id) ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Group Card with left padding for checkbox */}
            <div className="pl-12">
              <GroupCard group={group} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GroupList
