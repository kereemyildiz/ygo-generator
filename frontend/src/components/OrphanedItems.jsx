/**
 * OrphanedItems Component
 * Display and manage items that are not in any group
 * Features: Context menu, bulk selection, add to group, create new group
 */

import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog'
import { ContextMenu, ContextMenuItem, ContextMenuSub } from './ui/ContextMenu'
import { getFileColor } from '../lib/utils'
import {
  Package,
  Plus,
  FolderPlus,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react'

const OrphanedItems = () => {
  const {
    orphanedItems,
    groups,
    fetchOrphanedItems,
    addOrphanedToGroup,
    createGroupFromOrphaned,
    loading
  } = useApp()

  const [selectedItems, setSelectedItems] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  // Fetch orphaned items on mount
  useEffect(() => {
    fetchOrphanedItems()
  }, [fetchOrphanedItems])

  // Handle item selection toggle
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedItems.length === orphanedItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(orphanedItems.map(item => item.id))
    }
  }

  // Handle add to group (single item)
  const handleAddToGroup = async (itemId, groupId) => {
    try {
      await addOrphanedToGroup(groupId, [itemId])
      setSelectedItems([])
    } catch (err) {
      console.error('Failed to add item to group:', err)
    }
  }

  // Handle add selected to group (bulk)
  const handleAddSelectedToGroup = async (groupId) => {
    if (selectedItems.length === 0) return

    try {
      await addOrphanedToGroup(groupId, selectedItems)
      setSelectedItems([])
    } catch (err) {
      console.error('Failed to add items to group:', err)
    }
  }

  // Handle create new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedItems.length === 0) return

    try {
      await createGroupFromOrphaned(selectedItems, newGroupName)
      setSelectedItems([])
      setNewGroupName('')
      setShowCreateDialog(false)
    } catch (err) {
      console.error('Failed to create group:', err)
    }
  }

  // Empty state
  if (!loading && orphanedItems.length === 0) {
    return null  // Don't show section if no orphaned items
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Orphaned Items
              </CardTitle>
              <CardDescription>
                Items without any link relationships ({orphanedItems.length})
              </CardDescription>
            </div>

            {/* Bulk Actions */}
            {orphanedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleSelectAll}
                >
                  {selectedItems.length === orphanedItems.length ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>

                {selectedItems.length > 0 && (
                  <>
                    <Badge variant="secondary">
                      {selectedItems.length} selected
                    </Badge>

                    <Button
                      size="sm"
                      onClick={() => setShowCreateDialog(true)}
                      disabled={loading}
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Create New Group
                    </Button>

                    {groups.length > 0 && (
                      <div className="relative group">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Group
                        </Button>
                        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-popover border hidden group-hover:block z-10">
                          <div className="p-1">
                            {groups.map(group => (
                              <button
                                key={group.group_id}
                                onClick={() => handleAddSelectedToGroup(group.group_id)}
                                className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent"
                              >
                                {group.group_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading && orphanedItems.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading orphaned items...
            </div>
          ) : (
            <div className="space-y-2">
              {orphanedItems.map(item => (
                <OrphanedItem
                  key={item.id}
                  item={item}
                  groups={groups}
                  isSelected={selectedItems.includes(item.id)}
                  onToggleSelection={() => toggleItemSelection(item.id)}
                  onAddToGroup={handleAddToGroup}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent onClose={() => setShowCreateDialog(false)}>
          <DialogHeader>
            <DialogTitle>Create New Group from Selected Items</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Group Name
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup()
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Creating group with {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Individual orphaned item with context menu
const OrphanedItem = ({ item, groups, isSelected, onToggleSelection, onAddToGroup }) => {
  return (
    <ContextMenu
      trigger={
        <div
          className={`p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer ${
            isSelected ? 'border-primary bg-primary/10' : ''
          }`}
          onClick={onToggleSelection}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}

                <span className="font-mono text-sm font-medium">{item.id}</span>
                <div className={`px-2 py-0.5 rounded-md text-xs font-medium ${getFileColor(item.source_file)}`}>
                  {item.source_file}
                </div>
              </div>

              {/* Display item data */}
              <div className="text-sm text-muted-foreground space-y-1 ml-6">
                {Object.entries(item.data).map(([key, value]) => {
                  // Skip link columns and ID column
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
          </div>
        </div>
      }
    >
      {groups.length > 0 && (
        <ContextMenuSub label="Add to Group" icon={Plus}>
          {groups.map(group => (
            <ContextMenuItem
              key={group.group_id}
              onClick={() => onAddToGroup(item.id, group.group_id)}
            >
              {group.group_name}
            </ContextMenuItem>
          ))}
        </ContextMenuSub>
      )}
    </ContextMenu>
  )
}

export default OrphanedItems
