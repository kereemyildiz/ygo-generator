/**
 * FileUpload Component
 * Drag-and-drop file upload interface with file list
 */

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, Loader2, AlertCircle, Trash2, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button } from './ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Alert, AlertDescription } from './ui/Alert'
import { Badge } from './ui/Badge'

const FileUpload = () => {
  const { uploadedFiles, fetchUploadedFiles, uploadFiles, analyzeFiles, deleteFile, clearAllGroups, loading, error } = useApp()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [deleting, setDeleting] = useState(null)

  // Fetch uploaded files on mount
  useEffect(() => {
    fetchUploadedFiles()
  }, [fetchUploadedFiles])

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    setSelectedFiles(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
  })

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      await uploadFiles(selectedFiles)
      setSelectedFiles([])
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  // Handle analyze
  const handleAnalyze = async () => {
    try {
      await analyzeFiles()
    } catch (err) {
      console.error('Analysis failed:', err)
    }
  }

  // Remove selected file
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle delete uploaded file
  const handleDeleteFile = async (filename) => {
    if (!window.confirm(`"${filename}" dosyasını silmek istediğinizden emin misiniz?`)) return

    try {
      setDeleting(filename)
      await deleteFile(filename)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  // Handle clear all files
  const handleClearAll = async () => {
    if (!window.confirm(
      `TÜM VERİLERİ SİFIRLA\n\n` +
      `Bu işlem:\n` +
      `• ${uploadedFiles.length} dosyayı silecek\n` +
      `• Tüm grupları kaldıracak\n` +
      `• Tüm analiz sonuçlarını temizleyecek\n\n` +
      `Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`
    )) return

    try {
      setDeleting('all')

      // IMPORTANT: Clear groups FIRST to avoid race conditions
      await clearAllGroups()

      // Then delete all files in parallel
      await Promise.all(uploadedFiles.map(file => deleteFile(file)))

    } catch (err) {
      console.error('Clear all failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Excel Dosyalarını Yükle</CardTitle>
        <CardDescription>
          Gereksinimler, kullanım senaryoları veya test senaryoları içeren bir veya daha fazla Excel dosyası (.xlsx, .xls) yükleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary hover:bg-accent'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary font-medium">Dosyaları buraya bırakın...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Excel dosyalarını buraya sürükleyip bırakın
              </p>
              <p className="text-sm text-muted-foreground">
                veya göz atmak için tıklayın
              </p>
            </div>
          )}
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Seçili Dosyalar ({selectedFiles.length})</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSelectedFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFiles.length} Dosya Yükle
                </>
              )}
            </Button>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">
                Yüklenen Dosyalar ({uploadedFiles.length})
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleClearAll}
                  disabled={loading || deleting === 'all'}
                  size="sm"
                  variant="destructive"
                >
                  {deleting === 'all' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Temizleniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Tümünü Temizle
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  size="sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analiz ediliyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Bağlantıları Analiz Et
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((filename, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{filename}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteFile(filename)}
                    disabled={deleting === filename}
                    title="Dosyayı sil"
                  >
                    {deleting === filename ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No files message */}
        {uploadedFiles.length === 0 && selectedFiles.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Henüz dosya yüklenmedi. Başlamak için Excel dosyaları yükleyin.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default FileUpload
