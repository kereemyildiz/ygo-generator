/**
 * GroupList Component
 * Displays all groups as a list of expandable cards with batch selection
 */

import { useEffect, useState } from 'react'
import { Loader2, FolderOpen, Sparkles, CheckSquare, Square } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import GroupCard from './GroupCard'
import { Alert, AlertDescription, AlertTitle } from './ui/Alert'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { generateYGOBatch, getYGOJobStatus } from '../lib/api'
import YGOProgressModal from './YGOProgressModal'

const GroupList = () => {
  const { groups, fetchGroups, fetchStatistics, loading } = useApp()
  const toast = useToast()
  const [selectedGroups, setSelectedGroups] = useState(new Set())
  const [batchJobId, setBatchJobId] = useState(null)
  const [showBatchProgress, setShowBatchProgress] = useState(false)
  const [batchResults, setBatchResults] = useState(null)
  const [showBatchResults, setShowBatchResults] = useState(false)

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

  // Handle batch YGÖ generation
  const handleBatchGenerateYGO = async () => {
    if (selectedGroups.size === 0) {
      toast.error('Lütfen en az bir grup seçin')
      return
    }

    try {
      const groupIds = Array.from(selectedGroups)
      const response = await generateYGOBatch(groupIds)

      setBatchJobId(response.job_id)
      setShowBatchProgress(true)

      toast.success(response.message)
    } catch (err) {
      console.error('Failed to start batch YGÖ generation:', err)
      toast.error(err.response?.data?.detail || 'Toplu YGÖ üretimi başlatılamadı')
    }
  }

  // Handle batch YGÖ generation complete
  const handleBatchComplete = (result) => {
    setShowBatchProgress(false)
    setBatchResults(result)
    setShowBatchResults(true)
    setSelectedGroups(new Set()) // Clear selection
  }

  // Handle batch YGÖ generation error
  const handleBatchError = (error) => {
    setShowBatchProgress(false)
    toast.error(`Toplu YGÖ üretimi başarısız: ${error}`)
  }

  // Handle close batch results
  const handleCloseBatchResults = () => {
    setShowBatchResults(false)
    setBatchResults(null)
    setBatchJobId(null)
  }

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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            Gruplar ({groups.length})
          </h2>

          {/* Batch Selection Toolbar */}
          {selectedGroups.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <Badge variant="secondary" className="bg-primary/20">
                {selectedGroups.size} grup seçildi
              </Badge>
              <Button
                size="sm"
                onClick={handleBatchGenerateYGO}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Toplu YGÖ Üret
              </Button>
            </div>
          )}
        </div>

        {/* Select All Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={selectAllGroups}
          className="gap-2"
        >
          {selectedGroups.size === groups.length ? (
            <>
              <CheckSquare className="h-4 w-4" />
              Tümünü Kaldır
            </>
          ) : (
            <>
              <Square className="h-4 w-4" />
              Tümünü Seç
            </>
          )}
        </Button>
      </div>

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

      {/* Batch Progress Modal */}
      <YGOProgressModal
        isOpen={showBatchProgress}
        jobId={batchJobId}
        onComplete={handleBatchComplete}
        onError={handleBatchError}
      />

      {/* Batch Results Modal */}
      {showBatchResults && batchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseBatchResults}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-4xl mx-4 bg-background rounded-lg shadow-2xl border border-border max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Toplu YGÖ Üretim Sonuçları
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {batchResults.groups_processed} gruptan {batchResults.results?.filter(r => r.status === 'success').length} başarılı
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseBatchResults}
              >
                ×
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {batchResults.results?.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{result.group_name}</h3>
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status === 'success' ? 'Başarılı' : 'Başarısız'}
                      </Badge>
                    </div>

                    {result.status === 'success' ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.items_processed} madde işlendi
                        </p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium text-primary">
                            Üretilen YGÖ'yü görüntüle
                          </summary>
                          <div className="mt-2 p-3 bg-muted/30 rounded text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {result.ygo_text}
                          </div>
                        </details>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Hata: {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-border">
              <Button onClick={handleCloseBatchResults}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupList
