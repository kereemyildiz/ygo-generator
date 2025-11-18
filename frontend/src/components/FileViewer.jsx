/**
 * FileViewer Component
 * Modal for viewing file contents with virtualized table
 * Supports search, filtering, and high-performance rendering for large datasets
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Filter, FileX, Database, Loader2, FolderPlus, ListPlus, Columns } from 'lucide-react';
import VirtualizedTable from './VirtualizedTable';
import Modal from './ui/Modal';
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
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [detailItem, setDetailItem] = useState(null);

  // Fetch file data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.getFileAllData(filename);
        setData(result);
        // Initialize all columns as visible (no smart defaults)
        setVisibleColumns(new Set(result.columns));
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

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showGroupMenu) {
          setShowGroupMenu(false);
        } else if (showColumnMenu) {
          setShowColumnMenu(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e) => {
      if (showGroupMenu && !e.target.closest('.group-menu-container')) {
        setShowGroupMenu(false);
      }
      if (showColumnMenu && !e.target.closest('.column-menu-container')) {
        setShowColumnMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, showGroupMenu, showColumnMenu]);

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

  // Toggle column visibility
  const handleToggleColumn = (column) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        // Don't allow hiding all columns
        if (newSet.size > 1) {
          newSet.delete(column);
        }
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  // Get filtered columns
  const displayColumns = useMemo(() => {
    if (!data?.columns) return [];
    return data.columns.filter(col => visibleColumns.has(col));
  }, [data, visibleColumns]);

  // Handle row double-click to show details
  const handleRowDoubleClick = (item) => {
    setDetailItem(item);
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
                {data ? `Toplam ${data.total.toLocaleString()} madde` : 'Yükleniyor...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Kapat (Esc)"
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
                placeholder="Tüm sütunlarda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Column Visibility */}
            <div className="relative column-menu-container">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-muted transition-colors"
                title="Sütunları Göster/Gizle"
              >
                <Columns className="h-4 w-4" />
                <span className="whitespace-nowrap">Sütunlar</span>
              </button>

              {/* Column dropdown */}
              {showColumnMenu && data?.columns && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-background border-2 border-primary/20 rounded-lg shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                    <div className="p-3">
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-2 uppercase tracking-wide">
                        Görünür Sütunlar ({visibleColumns.size}/{data.columns.length})
                      </div>
                      <div className="space-y-1">
                        {data.columns.map(column => (
                          <label
                            key={column}
                            className="flex items-center gap-2 px-2 py-2 hover:bg-muted rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns.has(column)}
                              onChange={() => handleToggleColumn(column)}
                              disabled={visibleColumns.has(column) && visibleColumns.size === 1}
                              className="h-4 w-4 cursor-pointer"
                            />
                            <span className="text-sm flex-1 truncate">{column}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
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
                {filterOrphaned ? 'Linklenmeyenler Gösteriliyor' : 'Linklenmeyenleri Göster'}
              </span>
            </button>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {data?.total.toLocaleString()} maddeden {filteredItems.length.toLocaleString()}
            </div>

            {/* Group Actions */}
            {selectedItems.size > 0 && (
              <div className="relative group-menu-container">
                <button
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ListPlus className="h-4 w-4" />
                  <span className="whitespace-nowrap">
                    Gruba Ekle ({selectedItems.size})
                  </span>
                </button>

                {/* Dropdown Menu - Fixed positioning with high z-index */}
                {showGroupMenu && (
                  <>
                    {/* Backdrop for better visibility */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowGroupMenu(false)} />

                    <div className="absolute right-0 top-full mt-2 w-80 bg-background border-2 border-primary/20 rounded-lg shadow-2xl z-50 max-h-[400px] overflow-y-auto">
                      {/* Create New Group */}
                      <div className="p-4 border-b bg-muted/30 sticky top-0 z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <FolderPlus className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-sm">Yeni Grup Oluştur</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Grup adı girin..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateNewGroup()}
                            className="flex-1 px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                            autoFocus
                          />
                          <button
                            onClick={handleCreateNewGroup}
                            disabled={!newGroupName.trim()}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Oluştur
                          </button>
                        </div>
                      </div>

                      {/* Existing Groups */}
                      <div className="p-2">
                        <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wide">
                          Mevcut Gruplara Ekle
                        </div>
                        {groups.length === 0 ? (
                          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                            Henüz grup yok
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {groups.map(group => (
                              <button
                                key={group.group_id}
                                onClick={() => handleAddToGroup(group.group_id)}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 rounded-lg transition-colors group/item"
                              >
                                <div className="font-medium group-hover/item:text-primary transition-colors">
                                  {group.group_name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {group.item_count} madde
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
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
                <p className="text-muted-foreground">Dosya verileri yükleniyor...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Büyük dosyalar için bu biraz zaman alabilir
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <X className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium">Dosya yüklenemedi</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Kapat
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
                  columns={displayColumns}
                  searchTerm={searchTerm}
                  height={window.innerHeight - 280}
                  rowHeight={48}
                  selectable={true}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  selectedAll={selectedItems.size === filteredItems.length}
                  onSelectAll={handleSelectAll}
                  onRowDoubleClick={handleRowDoubleClick}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Filtrelerinize uygun öğe yok</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Arama veya filtre ayarlarınızı değiştirmeyi deneyin
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {detailItem && (
        <Modal
          isOpen={true}
          onClose={() => setDetailItem(null)}
          title={`Madde Detayları: ${detailItem.id}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* ID */}
            <div className="pb-3 border-b">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                ID
              </div>
              <div className="font-mono text-lg font-medium">{detailItem.id}</div>
            </div>

            {/* Links */}
            {(detailItem.in_links?.length > 0 || detailItem.out_links?.length > 0) && (
              <div className="pb-3 border-b">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Bağlantılar
                </div>
                <div className="space-y-2">
                  {detailItem.in_links?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-1">
                        Gelen Bağlantılar ({detailItem.in_links.length})
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {detailItem.in_links.join(', ')}
                      </div>
                    </div>
                  )}
                  {detailItem.out_links?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-1">
                        Giden Bağlantılar ({detailItem.out_links.length})
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {detailItem.out_links.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Data Fields */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Tüm Alanlar
              </div>
              <div className="space-y-3">
                {data?.columns.map((col) => {
                  const value = detailItem.data?.[col] ?? detailItem[col] ?? '';
                  const displayValue = Array.isArray(value) ? value.join(', ') : String(value);

                  return (
                    <div key={col} className="grid grid-cols-3 gap-4">
                      <div className="font-medium text-sm">{col}:</div>
                      <div className="col-span-2 text-sm text-muted-foreground break-words">
                        {displayValue || <span className="italic text-muted-foreground/50">N/A</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
