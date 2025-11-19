"""
Pydantic Schemas for API Request/Response Validation
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


# ===== Item Schemas =====

class ItemData(BaseModel):
    """Schema for item data from Excel files or manual entry."""
    id: str = Field(..., description="Unique item ID")
    source_file: str = Field(..., description="Name of source Excel file or 'manual'")
    source_type: str = Field(default="excel", description="Type of item: 'excel' or 'manual'")
    data: Dict[str, Any] = Field(..., description="All row data from Excel or manual fields")
    in_links: List[str] = Field(default_factory=list, description="List of incoming link IDs")
    out_links: List[str] = Field(default_factory=list, description="List of outgoing link IDs")


class CreateManualItemRequest(BaseModel):
    """Request to create a manual item in a group."""
    group_id: str = Field(..., description="ID of the group to add item to")
    title: Optional[str] = Field(None, description="Optional title of the manual item")
    description: Optional[str] = Field(None, description="Optional description/notes")


# ===== File Upload Schemas =====

class FileUploadResponse(BaseModel):
    """Response after uploading files."""
    message: str
    files_uploaded: List[str]
    total_files: int


class FileListResponse(BaseModel):
    """Response for listing uploaded files."""
    files: List[str]
    total_files: int


# ===== Analysis Schemas =====

class AnalysisRequest(BaseModel):
    """Request to analyze uploaded files."""
    file_paths: Optional[List[str]] = Field(None, description="Specific files to analyze (if None, analyzes all)")


class AnalysisResponse(BaseModel):
    """Response after analyzing files."""
    message: str
    groups_created: int
    total_items_analyzed: int
    orphaned_items: int
    statistics: Dict[str, Any]


# ===== Group Schemas =====

class GroupBase(BaseModel):
    """Base group schema."""
    group_name: str = Field(..., description="Name of the group")


class GroupCreate(GroupBase):
    """Schema for creating a new group."""
    items: List[ItemData] = Field(default_factory=list, description="Items in the group")


class GroupUpdate(BaseModel):
    """Schema for updating a group."""
    group_name: Optional[str] = Field(None, description="New name for the group")
    items: Optional[List[ItemData]] = Field(None, description="Updated list of items")


class GroupResponse(BaseModel):
    """Schema for group response."""
    group_id: str
    group_name: str
    items: List[ItemData]
    item_count: int
    item_ids: List[str]
    created_at: str
    updated_at: str


class GroupListResponse(BaseModel):
    """Response for listing all groups."""
    groups: List[GroupResponse]
    total_groups: int


# ===== Group Operations Schemas =====

class AddItemRequest(BaseModel):
    """Request to add an item to a group."""
    item: ItemData = Field(..., description="Item to add")


class RemoveItemRequest(BaseModel):
    """Request to remove an item from a group."""
    item_id: str = Field(..., description="ID of item to remove")


class MergeGroupsRequest(BaseModel):
    """Request to merge two groups."""
    group_id_1: str = Field(..., description="First group ID (will be kept)")
    group_id_2: str = Field(..., description="Second group ID (will be deleted)")
    new_name: Optional[str] = Field(None, description="Optional new name for merged group")


class MergeGroupsResponse(BaseModel):
    """Response after merging groups."""
    message: str
    merged_group: GroupResponse


# ===== Export Schemas =====

class ExportFormat(BaseModel):
    """Export format options."""
    format: str = Field(..., description="Export format: 'json' or 'excel'")


# ===== Error Schemas =====

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")


# ===== Statistics Schemas =====

class StatisticsResponse(BaseModel):
    """Response for group statistics."""
    total_groups: int
    total_items: int
    average_items_per_group: float
    largest_group_size: int
    smallest_group_size: int
    source_files: List[str]


# ===== Orphaned Items Schemas =====

class OrphanedItemsResponse(BaseModel):
    """Response for orphaned items."""
    orphaned_items: List[ItemData]
    total_orphaned: int


class AddOrphanedToGroupRequest(BaseModel):
    """Request to add orphaned item(s) to a group."""
    item_ids: List[str] = Field(..., description="IDs of orphaned items to add")
    group_id: str = Field(..., description="Target group ID")


class CreateGroupFromOrphanedRequest(BaseModel):
    """Request to create a new group from orphaned items."""
    item_ids: List[str] = Field(..., description="IDs of orphaned items to include")
    group_name: str = Field(..., description="Name for the new group")


class CreateGroupRequest(BaseModel):
    """Request to create a new group from any items."""
    items: List[ItemData] = Field(..., description="Items to include in the new group")
    group_name: str = Field(..., description="Name for the new group")
