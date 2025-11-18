"""
Link Analyzer Service
Analyzes link relationships between items and groups them into connected components.
"""

import networkx as nx
from typing import List, Dict, Any, Set


class LinkAnalyzer:
    """
    Analyzes link relationships and creates groups of connected items using graph theory.
    Uses NetworkX to build a graph and find connected components.
    """

    def __init__(self, items: List[Dict[str, Any]]):
        """
        Initialize analyzer with a list of items.

        Args:
            items: List of item dictionaries with 'id', 'in_links', and 'out_links'
        """
        self.items = items
        self.graph = nx.Graph()  # Undirected graph for finding connected components
        self.item_map = {}  # Map of item_id -> full item data

    def analyze(self) -> Dict[str, Any]:
        """
        Analyze all items and create groups based on link relationships.

        Returns:
            Dictionary containing:
                - groups: List of groups, each with connected items
                - total_groups: Count of groups found
                - total_items: Total items analyzed
                - orphaned_items: Items with no connections
        """
        # Build the graph
        self._build_graph()

        # Find connected components (groups)
        groups = self._find_groups()

        # Find orphaned items (items with no connections)
        orphaned = self._find_orphaned_items(groups)

        return {
            'groups': groups,
            'total_groups': len(groups),
            'total_items': len(self.items),
            'orphaned_items': orphaned,
            'total_orphaned': len(orphaned)
        }

    def _build_graph(self):
        """
        Build an undirected graph from item link relationships.
        Each item is a node, and links create edges between nodes.
        """
        # Add all items as nodes
        for item in self.items:
            item_id = item['id']
            self.graph.add_node(item_id)
            self.item_map[item_id] = item

        # Add edges based on in_links and out_links
        for item in self.items:
            item_id = item['id']

            # Process out_links (this item links TO other items)
            for target_id in item.get('out_links', []):
                if target_id in self.item_map:
                    # Add edge (undirected, so order doesn't matter)
                    self.graph.add_edge(item_id, target_id)

            # Process in_links (other items link TO this item)
            for source_id in item.get('in_links', []):
                if source_id in self.item_map:
                    # Add edge (undirected, so order doesn't matter)
                    self.graph.add_edge(source_id, item_id)

    def _find_groups(self) -> List[Dict[str, Any]]:
        """
        Find connected components in the graph, which represent groups of linked items.

        Returns:
            List of group dictionaries
        """
        groups = []

        # Find connected components using NetworkX
        connected_components = nx.connected_components(self.graph)

        for idx, component in enumerate(connected_components):
            # Skip single-node components with no edges (orphaned items)
            if len(component) == 1:
                node_id = list(component)[0]
                # Check if this node has any edges
                if self.graph.degree(node_id) == 0:
                    continue

            # Get full item data for all items in this component
            group_items = []
            for item_id in component:
                if item_id in self.item_map:
                    group_items.append(self.item_map[item_id])

            # Create group structure
            group = {
                'group_id': f"GROUP-{idx + 1:03d}",
                'group_name': f"Linklenen Maddeler {idx + 1}",
                'items': group_items,
                'item_count': len(group_items),
                'item_ids': list(component)
            }

            groups.append(group)

        return groups

    def _find_orphaned_items(self, groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Find items that are not part of any group (no connections).

        Args:
            groups: List of existing groups

        Returns:
            List of orphaned items
        """
        # Collect all item IDs that are in groups
        grouped_item_ids = set()
        for group in groups:
            grouped_item_ids.update(group['item_ids'])

        # Find items not in any group
        orphaned = []
        for item in self.items:
            if item['id'] not in grouped_item_ids:
                orphaned.append(item)

        return orphaned


def analyze_links(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Convenience function to analyze links and create groups.

    Args:
        items: List of item dictionaries

    Returns:
        Analysis results with groups
    """
    analyzer = LinkAnalyzer(items)
    return analyzer.analyze()


def get_group_statistics(groups: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate statistics about the groups.

    Args:
        groups: List of group dictionaries

    Returns:
        Statistics dictionary
    """
    if not groups:
        return {
            'total_groups': 0,
            'total_items_in_groups': 0,
            'average_group_size': 0,
            'largest_group_size': 0,
            'smallest_group_size': 0,
            'source_files': []
        }

    group_sizes = [group['item_count'] for group in groups]

    # Collect unique source files
    source_files = set()
    for group in groups:
        for item in group['items']:
            source_files.add(item.get('source_file', 'unknown'))

    return {
        'total_groups': len(groups),
        'total_items_in_groups': sum(group_sizes),
        'average_group_size': sum(group_sizes) / len(groups) if groups else 0,
        'largest_group_size': max(group_sizes) if group_sizes else 0,
        'smallest_group_size': min(group_sizes) if group_sizes else 0,
        'source_files': sorted(list(source_files))
    }
