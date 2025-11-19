/**
 * GroupCard Component
 * Expandable card displaying a group and its linked items
 */

import { useState, useMemo, useRef, memo } from 'react'
import { VariableSizeList as List } from 'react-window'
import { ChevronDown, ChevronUp, Trash2, Download, X, Edit2, Check, XCircle, FilePlus, Sparkles, CheckSquare, Square } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import Modal from './ui/Modal'
import { getFileColor } from '../lib/utils'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { exportGroupAsJSON, exportGroupAsExcel, createManualItem, generateYGO } from '../lib/api'

/**
 * VirtualizedRow Component
 * Renders either a file header or an item row
 */
const VirtualizedRow = memo(({ index, style, data }) => {
  const { flattenedRows, selectedItems, toggleItemSelection, handleRemoveItem, removing } = data
  const row = flattenedRows[index]

  // File header row
  if (row.type === 'header') {
    return (
      <div style={style} className="py-2">
        <div className={`px-3 py-1 rounded-md inline-block text-xs font-medium ${row.color}`}>
          {row.filename} ({row.count})
        </div>
      </div>
    )
  }

  // Item row
  const item = row.item
  const isSelected = selectedItems.has(item.id)

  return (
    <div style={style} className="py-1">
      <div
        className={`p-3 border rounded-lg transition-colors ${
          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Checkbox */}
            <button
              onClick={() => toggleItemSelection(item.id)}
              className="mt-0.5 flex-shrink-0"
              title={isSelected ? 'Seçimi kaldır' : 'Seç'}
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5 text-primary" />
              ) : (
                <Square className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>

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
    </div>
  )
})

VirtualizedRow.displayName = 'VirtualizedRow'

const GroupCard = ({ group }) => {
  const { deleteGroup, removeItemFromGroup, updateGroup, fetchGroups, trackYGOJob } = useApp()
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
  const [selectedItems, setSelectedItems] = useState(new Set())
  const listRef = useRef(null)

  // Group items by source file
  const itemsByFile = useMemo(() => {
    return group.items.reduce((acc, item) => {
      const file = item.source_file
      if (!acc[file]) {
        acc[file] = []
      }
      acc[file].push(item)
      return acc
    }, {})
  }, [group.items])

  // Flatten rows for virtualization (headers + items)
  const flattenedRows = useMemo(() => {
    const rows = []
    Object.entries(itemsByFile).forEach(([filename, items]) => {
      // Add file header
      rows.push({
        type: 'header',
        filename,
        count: items.length,
        color: getFileColor(filename)
      })
      // Add items
      items.forEach(item => {
        rows.push({
          type: 'item',
          item
        })
      })
    })
    return rows
  }, [itemsByFile])

  // Calculate row height based on content
  const getRowHeight = (index) => {
    const row = flattenedRows[index]
    if (row.type === 'header') {
      return 40 // Header height
    }

    // Estimate item height based on data fields and links
    const item = row.item
    const dataFieldCount = Object.keys(item.data).filter(key =>
      !key.toLowerCase().includes('link') &&
      !key.toLowerCase().includes('_id') &&
      key !== item.id
    ).length

    const hasLinks = item.in_links.length > 0 || item.out_links.length > 0
    const linkLines = (item.in_links.length > 0 ? 1 : 0) + (item.out_links.length > 0 ? 1 : 0)

    // Base height + data fields + links + padding
    return 70 + (dataFieldCount * 24) + (hasLinks ? linkLines * 20 : 0) + 16
  }

  // Handle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedItems.size === group.items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(group.items.map(item => item.id)))
    }
  }

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

  // Handle YGÖ generation (non-blocking)
  const handleGenerateYGO = async () => {
    try {
      // Get item IDs (selected or all)
      const itemIds = selectedItems.size > 0 ? Array.from(selectedItems) : null

      console.log('🚀 YGÖ Generation Started:', {
        groupId: group.group_id,
        groupName: group.group_name,
        selectedItemsCount: itemIds ? itemIds.length : group.items.length,
        itemIds: itemIds,
        timestamp: new Date().toISOString()
      })

      // Start YGÖ generation
      const response = await generateYGO(group.group_id, itemIds)

      console.log('✅ YGÖ Generation Request Accepted:', {
        jobId: response.job_id,
        message: response.message,
        timestamp: new Date().toISOString()
      })

      // Track job in global state (non-blocking!)
      trackYGOJob(response.job_id, {
        groupId: group.group_id,
        groupName: group.group_name,
        itemCount: itemIds ? itemIds.length : group.items.length,
        status: 'pending',
        progress: 0
      })

      toast.success(`${response.message} - Arka planda çalışmaya devam edebilirsiniz`)
    } catch (err) {
      console.error('❌ YGÖ Generation Failed:', {
        error: err,
        errorMessage: err.response?.data?.detail || err.message,
        groupId: group.group_id,
        timestamp: new Date().toISOString()
      })
      toast.error(err.response?.data?.detail || 'YGÖ üretimi başlatılamadı')
    }
  }

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
            {/* Generate SRS Button - AI Feature */}
            <Button
              size="sm"
              onClick={handleGenerateYGO}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
              title={selectedItems.size > 0
                ? `Seçili ${selectedItems.size} madde için YGÖ üret`
                : 'Tüm maddeler için YGÖ üret'}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              YGÖ Maddesi Üret
              {selectedItems.size > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/30">
                  {selectedItems.size}
                </Badge>
              )}
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
          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSelectAll}
            >
              {selectedItems.size === group.items.length ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Tümünün Seçimini Kaldır
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Tümünü Seç
                </>
              )}
            </Button>
            {selectedItems.size > 0 && (
              <Badge variant="secondary" className="text-sm">
                {selectedItems.size} madde seçili
              </Badge>
            )}
          </div>

          {/* Virtualized Items List */}
          <div className="border rounded-lg overflow-hidden">
            <List
              ref={listRef}
              height={Math.min(600, flattenedRows.length * 100)} // Max 600px height
              itemCount={flattenedRows.length}
              itemSize={getRowHeight}
              width="100%"
              itemData={{
                flattenedRows,
                selectedItems,
                toggleItemSelection,
                handleRemoveItem,
                removing
              }}
            >
              {VirtualizedRow}
            </List>
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
              disabled={creatingManualItem}
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
              Başlık (Opsiyonel)
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
              Açıklama<span className="text-destructive">*</span>
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
