/**
 * FileViewer Component
 * Modal for viewing file contents with virtualized table
 * Supports search, filtering, and high-performance rendering for large datasets
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Filter, FileX, Database, Loader2, FolderPlus, UserPlus } from 'lucide-react';
import VirtualizedTable from './VirtualizedTable';
import * as api from '../lib/api';
import { useApp } from '../context/AppContext';

/**
 * FileViewer Modal Component
 *
 * @param {Object} props
 * @param {string} props.filename - Name of the file to view
 * @param {Function} props.onClose - Callback when modal is closed
 */
export default function FileViewer({ filename, onClose }) {
  const { groups, addItemToGroup, createGroupFromOrphaned, fetchGroups } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrphaned, setFilterOrphaned] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Fetch file data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.getFileAllData(filename);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filename]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];

    let items = [...data.items];

    // Filter orphaned items
    if (filterOrphaned) {
      items = items.filter(item =>
        (!item.in_links || item.in_links.length === 0) &&
        (!item.out_links || item.out_links.length === 0)
      );
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item =>
        Object.values(item.data || {}).some(value =>
          String(value).toLowerCase().includes(searchLower)
        ) ||
        item.id?.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }, [data, searchTerm, filterOrphaned]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showGroupMenu) {
          setShowGroupMenu(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, showGroupMenu]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Selection handlers
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  // Add to existing group
  const handleAddToGroup = async (groupId) => {
    if (selectedItems.size === 0) return;

    try {
      const itemsToAdd = filteredItems.filter(item => selectedItems.has(item.id));
      for (const item of itemsToAdd) {
        await addItemToGroup(groupId, item);
      }
      setSelectedItems(new Set());
      setShowGroupMenu(false);
      await fetchGroups();
    } catch (err) {
      console.error('Failed to add items to group:', err);
    }
  };

  // Create new group from selection
  const handleCreateNewGroup = async () => {
    if (selectedItems.size === 0 || !newGroupName.trim()) return;

    try {
      const itemIds = Array.from(selectedItems);
      await createGroupFromOrphaned(itemIds, newGroupName);
      setSelectedItems(new Set());
      setShowGroupMenu(false);
      setNewGroupName('');
      await fetchGroups();
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="w-full h-full max-w-[95vw] max-h-[95vh] m-4 bg-background rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
              <Database className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{filename}</h2>
              <p className="text-sm text-muted-foreground">
                {data ? `${data.total.toLocaleString()} items total` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls */}
        {!loading && !error && (
          <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search in all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filter Orphaned */}
            <button
              onClick={() => setFilterOrphaned(!filterOrphaned)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filterOrphaned
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              <FileX className="h-4 w-4" />
              <span className="whitespace-nowrap">
                {filterOrphaned ? 'Showing Orphaned' : 'Show Orphaned'}
              </span>
            </button>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredItems.length.toLocaleString()} of {data?.total.toLocaleString()} items
            </div>

            {/* Group Actions */}
            {selectedItems.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="whitespace-nowrap">
                    Add to Group ({selectedItems.size})
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showGroupMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-background border rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                    {/* Create New Group */}
                    <div className="p-3 border-b">
                      <div className="flex items-center gap-2 mb-2">
                        <FolderPlus className="h-4 w-4" />
                        <span className="font-medium text-sm">Create New Group</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Group name..."
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateNewGroup()}
                          className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={handleCreateNewGroup}
                          disabled={!newGroupName.trim()}
                          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Create
                        </button>
                      </div>
                    </div>

                    {/* Existing Groups */}
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground px-2 py-1 font-medium">
                        Add to Existing Group
                      </div>
                      {groups.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          No groups available
                        </div>
                      ) : (
                        groups.map(group => (
                          <button
                            key={group.group_id}
                            onClick={() => handleAddToGroup(group.group_id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded transition-colors"
                          >
                            {group.group_name}
                            <span className="text-xs text-muted-foreground ml-2">
                              ({group.item_count} items)
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading file data...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a moment for large files
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <X className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium">Failed to load file</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && !error && data && (
            <div className="h-full p-4">
              {filteredItems.length > 0 ? (
                <VirtualizedTable
                  items={filteredItems}
                  columns={data.columns}
                  searchTerm={searchTerm}
                  height={window.innerHeight - 280}
                  rowHeight={48}
                  selectable={true}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  selectedAll={selectedItems.size === filteredItems.length}
                  onSelectAll={handleSelectAll}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No items match your filters</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try adjusting your search or filter settings
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
