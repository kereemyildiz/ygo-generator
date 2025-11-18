/**
 * YGOResultModal Component
 * Displays generated YGÖ (Software Requirement Specifications) result
 * Clearly separates INPUT items from OUTPUT (generated YGÖ text)
 */

import { useState } from 'react'
import { X, Copy, Download, CheckCircle2, ChevronDown, ChevronUp, FileInput, FileOutput } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { useToast } from '../context/ToastContext'

const YGOResultModal = ({ isOpen, onClose, result }) => {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const [showInputs, setShowInputs] = useState(false)

  // Debug logging
  if (isOpen && result) {
    console.log('🔍 DEBUG: YGOResultModal received:', {
      resultKeys: Object.keys(result),
      groupName: result.group_name,
      ygoTextType: typeof result.ygo_text,
      ygoTextLength: result.ygo_text?.length || 0,
      ygoTextPreview: result.ygo_text?.substring(0, 200) || 'EMPTY OR UNDEFINED',
      inputItemsCount: result.input_items?.length || 0,
      fullResult: result
    })
  }

  if (!isOpen || !result) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.ygo_text)
      setCopied(true)
      toast.success('YGÖ metni panoya kopyalandı')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Kopyalama başarısız')
    }
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([result.ygo_text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `YGO_${result.group_name || 'document'}_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('YGÖ dosyası indirildi')
    } catch (err) {
      toast.error('İndirme başarısız')
    }
  }

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
              Üretilen YGÖ
            </h2>
            {result.group_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Grup: {result.group_name}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {result.items_processed} madde işlendi
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* INPUT Section (Collapsible) */}
          {result.input_items && result.input_items.length > 0 && (
            <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowInputs(!showInputs)}
                className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileInput className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      INPUTS - Giriş Maddeleri
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      YGÖ üretiminde kullanılan {result.input_items.length} madde
                    </p>
                  </div>
                </div>
                {showInputs ? (
                  <ChevronUp className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                )}
              </button>

              {showInputs && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {result.input_items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-3 bg-background border border-blue-200 dark:border-blue-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <span className="font-mono text-sm font-medium text-blue-700 dark:text-blue-300">
                            {item.id}
                          </span>
                          {item.source_type === 'manual' && (
                            <Badge variant="default" className="text-xs bg-purple-500">
                              MANUEL
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {Object.entries(item.data || {}).map(([key, value]) => {
                            if (
                              key.toLowerCase().includes('link') ||
                              key.toLowerCase().includes('_id') ||
                              key === item.id
                            ) {
                              return null
                            }
                            return (
                              <div key={key} className="flex">
                                <span className="font-medium w-32 flex-shrink-0">{key}:</span>
                                <span className="flex-1">{value || 'N/A'}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OUTPUT Section */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20">
              <FileOutput className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                  OUTPUT - Üretilen YGÖ Maddesi
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  LLM tarafından oluşturulan yazılım gereksinim özellikleri
                </p>
              </div>
            </div>
            <div className="p-6 bg-green-50/50 dark:bg-green-950/20">
              <div className="bg-background rounded-lg p-6 font-mono text-sm whitespace-pre-wrap border border-green-200 dark:border-green-800">
                {result.ygo_text}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              <span className="font-medium">Output Uzunluğu:</span> {result.ygo_text?.length || 0} karakter
            </div>
            {result.input_items && (
              <div>
                <span className="font-medium">Input Sayısı:</span> {result.input_items.length} madde
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Kopyala
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Download className="h-4 w-4" />
              İndir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YGOResultModal
