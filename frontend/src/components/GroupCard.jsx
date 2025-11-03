/**
 * GroupCard Component
 * Expandable card displaying a group and its linked items
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Download, X, Edit2, Check, XCircle, FilePlus, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import Modal from './ui/Modal'
import { getFileColor } from '../lib/utils'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { exportGroupAsJSON, exportGroupAsExcel, createManualItem } from '../lib/api'

const GroupCard = ({ group }) => {
  const { deleteGroup, removeItemFromGroup, updateGroup, fetchGroups } = useApp()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [expanded, setExpanded] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(group.group_name)
  const [showManualItemModal, setShowManualItemModal] = useState(false)
  const [manualItemTitle, setManualItemTitle] = useState('')
  const [manualItemDescription, setManualItemDescription] = useState('')
  const [creatingManualItem, setCreatingManualItem] = useState(false)

  // Handle group deletion
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Grubu Sil',
      message: `"${group.group_name}" grubunu silmek istediğinizden emin misiniz?`,
      confirmText: 'Sil',
      cancelText: 'İptal',
      variant: 'destructive'
    })

    if (!confirmed) return

    try {
      await deleteGroup(group.group_id)
    } catch (err) {
      console.error('Failed to delete group:', err)
    }
  }

  // Handle item removal
  const handleRemoveItem = async (itemId) => {
    const confirmed = await confirm({
      title: 'Maddeyi Çıkar',
      message: 'Bu maddeyi gruptan çıkarmak istediğinizden emin misiniz?',
      confirmText: 'Çıkar',
      cancelText: 'İptal',
      variant: 'destructive'
    })

    if (!confirmed) return

    try {
      setRemoving(true)
      await removeItemFromGroup(group.group_id, itemId)
    } catch (err) {
      console.error('Failed to remove item:', err)
    } finally {
      setRemoving(false)
    }
  }

  // Handle name edit save
  const handleSaveName = async () => {
    if (editedName.trim() === '' || editedName === group.group_name) {
      setIsEditingName(false)
      setEditedName(group.group_name)
      return
    }

    try {
      await updateGroup(group.group_id, { group_name: editedName })
      setIsEditingName(false)
    } catch (err) {
      console.error('Failed to update group name:', err)
      setEditedName(group.group_name)
      setIsEditingName(false)
    }
  }

  // Handle name edit cancel
  const handleCancelEdit = () => {
    setEditedName(group.group_name)
    setIsEditingName(false)
  }

  // Handle key press in name edit
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Handle manual item creation
  const handleCreateManualItem = async () => {
    if (!manualItemTitle.trim()) {
      toast.error('Başlık gereklidir')
      return
    }

    try {
      setCreatingManualItem(true)
      await createManualItem(group.group_id, manualItemTitle, manualItemDescription)
      toast.success('Manuel Madde başarıyla eklendi')
      setManualItemTitle('')
      setManualItemDescription('')
      setShowManualItemModal(false)
      await fetchGroups()
    } catch (err) {
      console.error('Failed to create manual item:', err)
      toast.error('Manuel Madde eklenemedi')
    } finally {
      setCreatingManualItem(false)
    }
  }

  // Group items by source file
  const itemsByFile = group.items.reduce((acc, item) => {
    const file = item.source_file
    if (!acc[file]) {
      acc[file] = []
    }
    acc[file].push(item)
    return acc
  }, {})

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Editable Group Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  autoFocus
                  className="text-xl font-semibold px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveName}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Kaydet"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  onMouseDown={(e) => e.preventDefault()}
                  title="İptal"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <CardTitle className="text-xl">{group.group_name}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="İsmi düzenle"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary">
                {group.item_count} madde
              </Badge>
              <Badge variant="outline">
                {Object.keys(itemsByFile).length} dosya
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Generate SRS Button - AI Feature (Demo) */}
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
              title="Yapay zeka ile YGÖ maddesi üret"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              YGÖ Maddesi Üret
            </Button>

            {/* Add Manual Item Button */}
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
              onClick={() => setShowManualItemModal(true)}
              title="Manuel Madde ekle"
            >
              <FilePlus className="h-4 w-4 mr-1" />
              Manuel Madde
            </Button>

            {/* Export Buttons */}
            <a
              href={exportGroupAsJSON(group.group_id)}
              download
              className="inline-flex"
            >
              <Button size="sm" variant="outline" title="JSON olarak dışa aktar">
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </a>
            <a
              href={exportGroupAsExcel(group.group_id)}
              download
              className="inline-flex"
            >
              <Button size="sm" variant="outline" title="Excel olarak dışa aktar">
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </a>

            {/* Delete Button */}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              title="Grubu sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Expand/Collapse Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {expanded && (
        <CardContent>
          <div className="space-y-4">
            {Object.entries(itemsByFile).map(([filename, items]) => (
              <div key={filename}>
                <div className={`px-3 py-1 rounded-md inline-block mb-2 text-xs font-medium ${getFileColor(filename)}`}>
                  {filename} ({items.length})
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-mono text-sm font-medium">{item.id}</span>
                            {item.source_type === 'manual' && (
                              <Badge variant="default" className="text-xs bg-purple-500 hover:bg-purple-600">
                                MANUEL
                              </Badge>
                            )}
                            {item.in_links.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                ← {item.in_links.length}
                              </Badge>
                            )}
                            {item.out_links.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                → {item.out_links.length}
                              </Badge>
                            )}
                          </div>

                          {/* Display item data */}
                          <div className="text-sm text-muted-foreground space-y-1">
                            {Object.entries(item.data).map(([key, value]) => {
                              // Skip link columns and ID column (already shown)
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

                          {/* Links */}
                          {(item.in_links.length > 0 || item.out_links.length > 0) && (
                            <div className="mt-2 text-xs space-y-1">
                              {item.in_links.length > 0 && (
                                <div>
                                  <span className="font-medium">In Links: </span>
                                  <span className="text-muted-foreground">
                                    {item.in_links.join(', ')}
                                  </span>
                                </div>
                              )}
                              {item.out_links.length > 0 && (
                                <div>
                                  <span className="font-medium">Out Links: </span>
                                  <span className="text-muted-foreground">
                                    {item.out_links.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removing}
                          title="Gruptan çıkar"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Manual Item Creation Modal */}
      <Modal
        isOpen={showManualItemModal}
        onClose={() => setShowManualItemModal(false)}
        title="Manuel Madde Ekle"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowManualItemModal(false)}>
              İptal
            </Button>
            <Button
              onClick={handleCreateManualItem}
              disabled={!manualItemTitle.trim() || creatingManualItem}
            >
              {creatingManualItem ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Başlık <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={manualItemTitle}
              onChange={(e) => setManualItemTitle(e.target.value)}
              placeholder="madde başlığını girin..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              value={manualItemDescription}
              onChange={(e) => setManualItemDescription(e.target.value)}
              placeholder="Ek açıklama veya notlar..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Manuel Maddeler otomatik ID ile oluşturulur ve gruba eklenir.
          </p>
        </div>
      </Modal>
    </Card>
  )
}

export default GroupCard
