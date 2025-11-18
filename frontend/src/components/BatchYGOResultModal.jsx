/**
 * BatchYGOResultModal Component
 * Displays batch YGÖ generation results for multiple groups
 */

import { useState } from 'react'
import { X, Download, CheckCircle, XCircle, ChevronDown, ChevronUp, FileInput, FileOutput } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { useToast } from '../context/ToastContext'

const BatchYGOResultModal = ({ isOpen, onClose, batchResult }) => {
  const toast = useToast()
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  if (!isOpen || !batchResult) return null

  const toggleGroup = (index) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleDownloadAll = () => {
    try {
      const successResults = batchResult.results.filter(r => r.status === 'success')
      const combinedText = successResults.map(r =>
        `=== ${r.group_name} ===\n\n${r.ygo_text}\n\n`
      ).join('\n')

      const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Batch_YGO_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Toplu YGÖ dosyası indirildi')
    } catch (err) {
      toast.error('İndirme başarısız')
    }
  }

  const successCount = batchResult.results?.filter(r => r.status === 'success').length || 0
  const failureCount = batchResult.results?.filter(r => r.status === 'failed').length || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-6xl mx-4 bg-background rounded-lg shadow-2xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Toplu YGÖ Üretim Sonuçları
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {batchResult.groups_processed} gruptan {successCount} başarılı, {failureCount} başarısız
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {batchResult.results?.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg overflow-hidden ${
                result.status === 'success'
                  ? 'border-green-200 dark:border-green-800'
                  : 'border-red-200 dark:border-red-800'
              }`}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(index)}
                className={`w-full flex items-center justify-between p-4 transition-colors ${
                  result.status === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">
                      {result.group_name}
                    </h3>
                    {result.status === 'success' ? (
                      <p className="text-sm text-muted-foreground">
                        {result.items_processed} madde işlendi
                      </p>
                    ) : (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Hata: {result.error}
                      </p>
                    )}
                  </div>
                </div>
                {result.status === 'success' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">
                      Başarılı
                    </Badge>
                    {expandedGroups.has(index) ? (
                      <ChevronUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                )}
              </button>

              {/* Expanded Content */}
              {expandedGroups.has(index) && result.status === 'success' && (
                <div className="p-6 bg-green-50/50 dark:bg-green-950/20 space-y-4">
                  {/* INPUTS Section */}
                  {result.input_items && result.input_items.length > 0 && (
                    <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-background">
                      <div className="flex items-center gap-2 mb-3">
                        <FileInput className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-sm">INPUTS ({result.input_items.length} madde)</h4>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.input_items.map((item, idx) => (
                          <span key={idx}>{item.id}{idx < result.input_items.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OUTPUT Section */}
                  <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden bg-background">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                      <FileOutput className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold text-sm">OUTPUT - Üretilen YGÖ</h4>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <pre className="font-mono text-xs whitespace-pre-wrap">
                        {result.ygo_text}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-green-600">{successCount} başarılı</span>
            {failureCount > 0 && (
              <>
                {' • '}
                <span className="font-medium text-red-600">{failureCount} başarısız</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            {successCount > 0 && (
              <Button
                onClick={handleDownloadAll}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Download className="h-4 w-4" />
                Tümünü İndir
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatchYGOResultModal
