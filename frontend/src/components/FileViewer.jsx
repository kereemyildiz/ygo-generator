/**
 * FileViewer Component
 * Modal for viewing file contents with virtualized table
 * Supports search, filtering, and high-performance rendering for large datasets
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Filter, FileX, Database, Loader2 } from 'lucide-react';
import VirtualizedTable from './VirtualizedTable';
import * as api from '../lib/api';

/**
 * FileViewer Modal Component
 *
 * @param {Object} props
 * @param {string} props.filename - Name of the file to view
 * @param {Function} props.onClose - Callback when modal is closed
 */
export default function FileViewer({ filename, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrphaned, setFilterOrphaned] = useState(false);

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
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
