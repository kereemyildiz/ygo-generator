/**
 * YGOProgressModal Component
 * Shows progress of YGÖ generation job
 */

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { getYGOJobStatus } from '../lib/api'

const YGOProgressModal = ({ isOpen, jobId, onComplete, onError }) => {
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !jobId) return

    let intervalId

    const checkStatus = async () => {
      try {
        const jobData = await getYGOJobStatus(jobId)
        setJob(jobData)

        // Check if job is complete or failed
        if (jobData.status === 'completed') {
          clearInterval(intervalId)
          setTimeout(() => {
            if (onComplete) onComplete(jobData.result)
          }, 500)
        } else if (jobData.status === 'failed') {
          clearInterval(intervalId)
          setError(jobData.error)
          if (onError) onError(jobData.error)
        }
      } catch (err) {
        setError(err.message)
        clearInterval(intervalId)
        if (onError) onError(err.message)
      }
    }

    // Initial check
    checkStatus()

    // Poll every 2 seconds
    intervalId = setInterval(checkStatus, 2000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen, jobId, onComplete, onError])

  if (!isOpen) return null

  const getStatusIcon = () => {
    if (!job) return <Loader2 className="h-8 w-8 animate-spin text-primary" />

    switch (job.status) {
      case 'completed':
        return <CheckCircle2 className="h-8 w-8 text-green-600" />
      case 'failed':
        return <XCircle className="h-8 w-8 text-red-600" />
      case 'running':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      default:
        return <AlertCircle className="h-8 w-8 text-yellow-600" />
    }
  }

  const getStatusText = () => {
    if (!job) return 'İş yükleniyor...'

    switch (job.status) {
      case 'pending':
        return 'Beklemede...'
      case 'running':
        return 'YGÖ üretiliyor...'
      case 'completed':
        return 'Tamamlandı!'
      case 'failed':
        return 'Hata oluştu'
      default:
        return job.status
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-background rounded-lg shadow-2xl border border-border p-8">
        <div className="flex flex-col items-center gap-6">
          {/* Status Icon */}
          {getStatusIcon()}

          {/* Status Text */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              {getStatusText()}
            </h3>
            {job && (
              <p className="text-sm text-muted-foreground">
                {job.description}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {job && job.status === 'running' && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>İlerleme</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <div className="text-xs text-center text-muted-foreground mt-2">
                {job.processed_items} / {job.total_items} madde
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          {/* Completed Info */}
          {job && job.status === 'completed' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>YGÖ başarıyla oluşturuldu</p>
              <p className="mt-1">
                {job.processed_items} madde işlendi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default YGOProgressModal
