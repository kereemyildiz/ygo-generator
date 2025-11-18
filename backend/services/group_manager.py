"""
Group Manager Service
Handles CRUD operations on groups (Create, Read, Update, Delete).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime


class GroupManager:
    """
    Manages groups of linked items with CRUD operations.
    Groups are stored in memory (can be extended to use database).
    """

    def __init__(self):
        """Initialize the group manager with empty storage."""
        self.groups = {}  # Dict of group_id -> group data
        self.orphaned_items = []  # List of items not in any group
        self.next_id = 1

    def create_group(self, group_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new group.

        Args:
            group_data: Dictionary containing group information

        Returns:
            Created group with assigned ID
        """
        group_id = group_data.get('group_id', f"GROUP-{self.next_id:03d}")

        # Ensure unique ID
        while group_id in self.groups:
            self.next_id += 1
            group_id = f"GROUP-{self.next_id:03d}"

        group = {
            'group_id': group_id,
            'group_name': group_data.get('group_name', f"Group {self.next_id}"),
            'items': group_data.get('items', []),
            'item_count': len(group_data.get('items', [])),
            'item_ids': [item['id'] for item in group_data.get('items', [])],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        self.groups[group_id] = group
        self.next_id += 1

        return group

    def get_all_groups(self) -> List[Dict[str, Any]]:
        """
        Get all groups.

        Returns:
            List of all groups
        """
        return list(self.groups.values())

    def get_group(self, group_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific group by ID.

        Args:
            group_id: The group ID to retrieve

        Returns:
            Group data or None if not found
        """
        return self.groups.get(group_id)

    def update_group(self, group_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a group's data.

        Args:
            group_id: The group ID to update
            updates: Dictionary of fields to update

        Returns:
            Updated group or None if not found
        """
        if group_id not in self.groups:
            return None

        group = self.groups[group_id]

        # Update allowed fields
        if 'group_name' in updates:
            group['group_name'] = updates['group_name']

        if 'items' in updates:
            group['items'] = updates['items']
            group['item_count'] = len(updates['items'])
            group['item_ids'] = [item['id'] for item in updates['items']]

        group['updated_at'] = datetime.now().isoformat()

        return group

    def delete_group(self, group_id: str) -> bool:
        """
        Delete a group.

        Args:
            group_id: The group ID to delete

        Returns:
            True if deleted, False if not found
        """
        if group_id in self.groups:
            del self.groups[group_id]
            return True
        return False

    def add_item_to_group(self, group_id: str, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Add an item to a group.

        Args:
            group_id: The group ID
            item: Item data to add

        Returns:
            Updated group or None if not found
        """
        if group_id not in self.groups:
            return None

        group = self.groups[group_id]

        # Check if item already exists in group
        item_id = item['id']
        if item_id in group['item_ids']:
            return group  # Already exists, no change needed

        # Add item
        group['items'].append(item)
        group['item_ids'].append(item_id)
        group['item_count'] = len(group['items'])
        group['updated_at'] = datetime.now().isoformat()

        return group

    def remove_item_from_group(self, group_id: str, item_id: str) -> Optional[Dict[str, Any]]:
        """
        Remove an item from a group.

        Args:
            group_id: The group ID
            item_id: ID of the item to remove

        Returns:
            Updated group or None if not found
        """
        if group_id not in self.groups:
            return None

        group = self.groups[group_id]

        # Find and remove item
        group['items'] = [item for item in group['items'] if item['id'] != item_id]
        group['item_ids'] = [id for id in group['item_ids'] if id != item_id]
        group['item_count'] = len(group['items'])
        group['updated_at'] = datetime.now().isoformat()

        return group

    def merge_groups(self, group_id_1: str, group_id_2: str, new_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Merge two groups into one.

        Args:
            group_id_1: First group ID (this one will be kept)
            group_id_2: Second group ID (this one will be deleted)
            new_name: Optional new name for merged group

        Returns:
            Merged group or None if either group not found
        """
        if group_id_1 not in self.groups or group_id_2 not in self.groups:
            return None

        group1 = self.groups[group_id_1]
        group2 = self.groups[group_id_2]

        # Merge items (avoid duplicates)
        existing_ids = set(group1['item_ids'])
        for item in group2['items']:
            if item['id'] not in existing_ids:
                group1['items'].append(item)
                group1['item_ids'].append(item['id'])
                existing_ids.add(item['id'])

        # Update counts and metadata
        group1['item_count'] = len(group1['items'])
        group1['updated_at'] = datetime.now().isoformat()

        # Update name if provided
        if new_name:
            group1['group_name'] = new_name
        else:
            group1['group_name'] = f"{group1['group_name']} + {group2['group_name']}"

        # Delete second group
        del self.groups[group_id_2]

        return group1

    def load_groups(self, groups: List[Dict[str, Any]]):
        """
        Load multiple groups (useful for bulk import).

        Args:
            groups: List of group dictionaries
        """
        for group in groups:
            self.create_group(group)

    def clear_all_groups(self):
        """Clear all groups and orphaned items from storage."""
        self.groups = {}
        self.orphaned_items = []
        self.next_id = 1

    def set_orphaned_items(self, items: List[Dict[str, Any]]):
        """
        Set the list of orphaned items.

        Args:
            items: List of orphaned item dictionaries
        """
        self.orphaned_items = items

    def get_orphaned_items(self) -> List[Dict[str, Any]]:
        """
        Get all orphaned items.

        Returns:
            List of orphaned items
        """
        return self.orphaned_items

    def remove_orphaned_item(self, item_id: str) -> bool:
        """
        Remove an item from orphaned items list.

        Args:
            item_id: ID of item to remove

        Returns:
            True if removed, False if not found
        """
        original_length = len(self.orphaned_items)
        self.orphaned_items = [item for item in self.orphaned_items if item['id'] != item_id]
        return len(self.orphaned_items) < original_length

    def create_group_from_orphaned_items(self, item_ids: List[str], group_name: str) -> Optional[Dict[str, Any]]:
        """
        Create a new group from selected orphaned items.

        Args:
            item_ids: List of item IDs to include in the new group
            group_name: Name for the new group

        Returns:
            Created group or None if no valid items found
        """
        # Find items by IDs
        items_to_add = [item for item in self.orphaned_items if item['id'] in item_ids]

        if not items_to_add:
            return None

        # Create new group
        group_data = {
            'group_name': group_name,
            'items': items_to_add
        }
        new_group = self.create_group(group_data)

        # Remove items from orphaned list
        for item_id in item_ids:
            self.remove_orphaned_item(item_id)

        return new_group

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about all groups.

        Returns:
            Statistics dictionary
        """
        if not self.groups:
            return {
                'total_groups': 0,
                'total_items': 0,
                'average_items_per_group': 0
            }

        total_items = sum(group['item_count'] for group in self.groups.values())

        return {
            'total_groups': len(self.groups),
            'total_items': total_items,
            'average_items_per_group': total_items / len(self.groups) if self.groups else 0,
            'group_ids': list(self.groups.keys())
        }

    def clear_all(self) -> None:
        """
        Clear all groups and orphaned items.
        Used on application startup to ensure clean state.
        """
        self.groups = {}
        self.orphaned_items = []
        self.next_id = 1


# Global instance for the application
group_manager = GroupManager()
