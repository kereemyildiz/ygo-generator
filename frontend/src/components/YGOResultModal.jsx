/**
 * YGOResultModal Component
 * Displays generated YGÖ (Software Requirement Specifications) result
 */

import { useState } from 'react'
import { X, Copy, Download, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/Button'
import { useToast } from '../context/ToastContext'

const YGOResultModal = ({ isOpen, onClose, result }) => {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

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
      <div className="relative z-10 w-full max-w-4xl mx-4 bg-background rounded-lg shadow-2xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap">
            {result.ygo_text}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {result.ygo_text?.length || 0} karakter
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
