/**
 * YGOJobTracker Component
 * Non-blocking notification bar that shows active YGÖ generation jobs
 * Allows users to continue working while jobs run in the background
 */

import { useEffect, useState } from 'react'
import { Loader2, Sparkles, Eye, X, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/Button'
import { useApp } from '../context/AppContext'
import { getYGOJobStatus } from '../lib/api'
import YGOResultModal from './YGOResultModal'

const YGOJobTracker = () => {
  const {
    activeYGOJobs,
    completedYGOResults,
    updateYGOJobStatus,
    completeYGOJob,
    failYGOJob,
    removeCompletedYGOResult
  } = useApp()

  const [selectedResult, setSelectedResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)

  // Poll active jobs for status updates
  useEffect(() => {
    if (activeYGOJobs.length === 0) return

    const intervalId = setInterval(async () => {
      for (const job of activeYGOJobs) {
        try {
          const jobData = await getYGOJobStatus(job.jobId)

          console.log('📊 YGÖ Job Status Update:', {
            jobId: job.jobId,
            status: jobData.status,
            progress: jobData.progress,
            timestamp: new Date().toISOString()
          })

          // Update job status
          updateYGOJobStatus(job.jobId, {
            status: jobData.status,
            progress: jobData.progress,
            processedItems: jobData.processed_items,
            totalItems: jobData.total_items,
            description: jobData.description
          })

          // Handle completion
          if (jobData.status === 'completed') {
            completeYGOJob(job.jobId, jobData.result)
          } else if (jobData.status === 'failed') {
            failYGOJob(job.jobId, jobData.error)
          }
        } catch (err) {
          console.error('❌ Failed to check job status:', job.jobId, err)
        }
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(intervalId)
  }, [activeYGOJobs, updateYGOJobStatus, completeYGOJob, failYGOJob])

  // Handle view result
  const handleViewResult = (result) => {
    setSelectedResult(result.result)
    setShowResultModal(true)
  }

  // Handle close result modal
  const handleCloseResult = () => {
    setShowResultModal(false)
    setSelectedResult(null)
  }

  // Handle dismiss completed result
  const handleDismissResult = (jobId, e) => {
    e.stopPropagation()
    removeCompletedYGOResult(jobId)
  }

  // Don't render if no jobs and no completed results
  if (activeYGOJobs.length === 0 && completedYGOResults.length === 0) {
    return null
  }

  return (
    <>
      {/* Fixed bottom notification bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
          {/* Active Jobs */}
          {activeYGOJobs.map((job) => (
            <div
              key={job.jobId}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {job.groupName || 'YGÖ üretiliyor...'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (Job ID: {job.jobId.substring(0, 8)})
                      </span>
                    </div>
                    {job.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {job.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {job.progress !== undefined && (
                  <div className="ml-6 w-64">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>İlerleme</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    {job.processedItems !== undefined && job.totalItems !== undefined && (
                      <div className="text-xs text-center text-muted-foreground mt-1">
                        {job.processedItems} / {job.totalItems} madde
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Completed Results */}
          {completedYGOResults.map((completedJob) => (
            <div
              key={completedJob.jobId}
              className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-foreground">
                        {completedJob.result.group_name || 'YGÖ'} - Tamamlandı!
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {completedJob.result.items_processed} madde işlendi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleViewResult(completedJob)}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Eye className="h-4 w-4" />
                    Sonucu Görüntüle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDismissResult(completedJob.jobId, e)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Result Modal */}
      <YGOResultModal
        isOpen={showResultModal}
        onClose={handleCloseResult}
        result={selectedResult}
      />
    </>
  )
}

export default YGOJobTracker
