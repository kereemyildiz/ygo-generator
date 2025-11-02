/**
 * VirtualizedTable Component
 * High-performance table using react-window for rendering large datasets
 * Only renders visible rows for optimal performance with 1000+ items
 */

import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

/**
 * Header component for the virtualized table
 */
const TableHeader = ({ columns, selectable, selectedAll, onSelectAll }) => (
  <div className="sticky top-0 z-10 border-b bg-muted/50 backdrop-blur">
    <div className="flex">
      {selectable && (
        <div className="w-12 px-4 py-3 flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedAll}
            onChange={onSelectAll}
            className="h-4 w-4 cursor-pointer"
          />
        </div>
      )}
      {columns.map((col, idx) => (
        <div
          key={idx}
          className="flex-1 min-w-[150px] px-4 py-3 text-sm font-medium text-muted-foreground"
        >
          {col}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Row component for the virtualized table
 * Memoized for performance
 */
const Row = memo(({ data, index, style }) => {
  const { items, columns, searchTerm, selectable, selectedItems, onSelectItem } = data;
  const item = items[index];
  const isSelected = selectable && selectedItems?.has(item.id);

  // Highlight search terms
  const highlightText = (text, search) => {
    if (!search) return text;

    const searchLower = search.toLowerCase();
    const textStr = String(text);
    const textLower = textStr.toLowerCase();

    if (!textLower.includes(searchLower)) return text;

    const parts = [];
    let lastIndex = 0;
    let currentIndex = textLower.indexOf(searchLower);

    while (currentIndex !== -1) {
      // Add text before match
      if (currentIndex > lastIndex) {
        parts.push(
          <span key={`normal-${lastIndex}`}>
            {textStr.slice(lastIndex, currentIndex)}
          </span>
        );
      }

      // Add highlighted match
      parts.push(
        <span key={`highlight-${currentIndex}`} className="bg-yellow-200 dark:bg-yellow-900">
          {textStr.slice(currentIndex, currentIndex + search.length)}
        </span>
      );

      lastIndex = currentIndex + search.length;
      currentIndex = textLower.indexOf(searchLower, lastIndex);
    }

    // Add remaining text
    if (lastIndex < textStr.length) {
      parts.push(
        <span key={`normal-${lastIndex}`}>
          {textStr.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div
      style={style}
      className={`flex border-b hover:bg-muted/50 transition-colors ${
        index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
      } ${isSelected ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
    >
      {selectable && (
        <div className="w-12 px-4 py-3 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectItem(item.id)}
            className="h-4 w-4 cursor-pointer"
          />
        </div>
      )}
      {columns.map((col, idx) => {
        const value = item.data?.[col] ?? item[col] ?? '';
        const displayValue = Array.isArray(value) ? value.join(', ') : value;

        return (
          <div
            key={idx}
            className="flex-1 min-w-[150px] px-4 py-3 text-sm truncate"
            title={String(displayValue)}
          >
            {highlightText(displayValue, searchTerm)}
          </div>
        );
      })}
    </div>
  );
});

Row.displayName = 'VirtualizedRow';

/**
 * VirtualizedTable Component
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to display
 * @param {Array} props.columns - Array of column names
 * @param {string} props.searchTerm - Search term for highlighting
 * @param {number} props.height - Height of the table viewport
 * @param {number} props.rowHeight - Height of each row
 * @param {boolean} props.selectable - Enable row selection
 * @param {Set} props.selectedItems - Set of selected item IDs
 * @param {Function} props.onSelectItem - Callback when item is selected
 * @param {boolean} props.selectedAll - All items selected
 * @param {Function} props.onSelectAll - Callback when select all is toggled
 */
export default function VirtualizedTable({
  items = [],
  columns = [],
  searchTerm = '',
  height = 600,
  rowHeight = 48,
  selectable = false,
  selectedItems = new Set(),
  onSelectItem = () => {},
  selectedAll = false,
  onSelectAll = () => {}
}) {
  if (!items.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No items to display
      </div>
    );
  }

  if (!columns.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No columns defined
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <TableHeader
        columns={columns}
        selectable={selectable}
        selectedAll={selectedAll}
        onSelectAll={onSelectAll}
      />
      <List
        height={height}
        itemCount={items.length}
        itemSize={rowHeight}
        width="100%"
        itemData={{ items, columns, searchTerm, selectable, selectedItems, onSelectItem }}
      >
        {Row}
      </List>

      {/* Footer with row count */}
      <div className="border-t bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
        Showing {items.length.toLocaleString()} row{items.length !== 1 ? 's' : ''}
        {selectable && selectedItems.size > 0 && (
          <span className="ml-2 text-primary font-medium">
            ({selectedItems.size} selected)
          </span>
        )}
      </div>
    </div>
  );
}
