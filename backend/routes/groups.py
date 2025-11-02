"""
Group Management Routes
Handles CRUD operations on groups.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from typing import List
import json
import pandas as pd
from pathlib import Path
from datetime import datetime

from models.schemas import (
    GroupResponse, GroupListResponse, GroupUpdate,
    AddItemRequest, RemoveItemRequest, MergeGroupsRequest, MergeGroupsResponse,
    StatisticsResponse
)
from services.group_manager import group_manager


router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.get("", response_model=GroupListResponse)
async def get_all_groups():
    """
    Get all groups.

    Returns:
        GroupListResponse with list of all groups
    """
    try:
        groups = group_manager.get_all_groups()

        return GroupListResponse(
            groups=groups,
            total_groups=len(groups)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve groups: {str(e)}"
        )


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(group_id: str):
    """
    Get a specific group by ID.

    Args:
        group_id: The group ID

    Returns:
        GroupResponse with group details
    """
    group = group_manager.get_group(group_id)

    if not group:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {group_id}"
        )

    return GroupResponse(**group)


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(group_id: str, updates: GroupUpdate):
    """
    Update a group.

    Args:
        group_id: The group ID
        updates: Update data

    Returns:
        Updated group
    """
    # Convert updates to dict, excluding None values
    update_data = updates.dict(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No update data provided"
        )

    group = group_manager.update_group(group_id, update_data)

    if not group:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {group_id}"
        )

    return GroupResponse(**group)


@router.delete("/{group_id}")
async def delete_group(group_id: str):
    """
    Delete a group.

    Args:
        group_id: The group ID

    Returns:
        Success message
    """
    success = group_manager.delete_group(group_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {group_id}"
        )

    return {"message": f"Group {group_id} deleted successfully"}


@router.post("/{group_id}/items", response_model=GroupResponse)
async def add_item_to_group(group_id: str, request: AddItemRequest):
    """
    Add an item to a group.

    Args:
        group_id: The group ID
        request: Request with item data

    Returns:
        Updated group
    """
    item_data = request.item.dict()
    group = group_manager.add_item_to_group(group_id, item_data)

    if not group:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {group_id}"
        )

    return GroupResponse(**group)


@router.delete("/{group_id}/items/{item_id}", response_model=GroupResponse)
async def remove_item_from_group(group_id: str, item_id: str):
    """
    Remove an item from a group.

    Args:
        group_id: The group ID
        item_id: The item ID to remove

    Returns:
        Updated group
    """
    group = group_manager.remove_item_from_group(group_id, item_id)

    if not group:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {group_id}"
        )

    return GroupResponse(**group)


@router.post("/merge", response_model=MergeGroupsResponse)
async def merge_groups(request: MergeGroupsRequest):
    """
    Merge two groups into one.

    Args:
        request: Request with group IDs to merge

    Returns:
        Merged group
    """
    merged_group = group_manager.merge_groups(
        request.group_id_1,
        request.group_id_2,
        request.new_name
    )

    if not merged_group:
        raise HTTPException(
            status_code=404,
            detail="One or both groups not found"
        )

    return MergeGroupsResponse(
        message=f"Groups merged successfully into {merged_group['group_id']}",
        merged_group=GroupResponse(**merged_group)
    )


@router.get("/statistics/summary", response_model=StatisticsResponse)
async def get_statistics():
    """
    Get statistics about all groups.

    Returns:
        StatisticsResponse with group statistics
    """
    try:
        stats = group_manager.get_statistics()

        # Get additional statistics from groups
        groups = group_manager.get_all_groups()

        if groups:
            group_sizes = [g['item_count'] for g in groups]
            source_files = set()
            for g in groups:
                for item in g['items']:
                    source_files.add(item.get('source_file', 'unknown'))

            return StatisticsResponse(
                total_groups=stats['total_groups'],
                total_items=stats['total_items'],
                average_items_per_group=stats['average_items_per_group'],
                largest_group_size=max(group_sizes) if group_sizes else 0,
                smallest_group_size=min(group_sizes) if group_sizes else 0,
                source_files=sorted(list(source_files))
            )
        else:
            return StatisticsResponse(
                total_groups=0,
                total_items=0,
                average_items_per_group=0,
                largest_group_size=0,
                smallest_group_size=0,
                source_files=[]
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )


@router.get("/{group_id}/export/json")
async def export_group_json(group_id: str):
    """
    Export a group as JSON file.

    Args:
        group_id: The group ID

    Returns:
        JSON file download
    """
    group = group_manager.get_group(group_id)

    if not group:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {group_id}"
        )

    # Create temporary file
    temp_dir = Path(__file__).parent.parent / "uploads"
    temp_file = temp_dir / f"{group_id}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    try:
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(group, f, indent=2, ensure_ascii=False)

        return FileResponse(
            path=temp_file,
            media_type='application/json',
            filename=f"{group_id}.json"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export group: {str(e)}"
        )


@router.get("/{group_id}/export/excel")
async def export_group_excel(group_id: str):
    """
    Export a group as Excel file.

    Args:
        group_id: The group ID

    Returns:
        Excel file download
    """
    group = group_manager.get_group(group_id)

    if not group:
        raise HTTPException(
            status_code=404,
            detail=f"Group not found: {group_id}"
        )

    # Prepare data for Excel
    rows = []
    for item in group['items']:
        row = {
            'Item_ID': item['id'],
            'Source_File': item['source_file'],
            'In_Links': ', '.join(item.get('in_links', [])),
            'Out_Links': ', '.join(item.get('out_links', []))
        }
        # Add all data fields
        row.update(item.get('data', {}))
        rows.append(row)

    df = pd.DataFrame(rows)

    # Create temporary file
    temp_dir = Path(__file__).parent.parent / "uploads"
    temp_file = temp_dir / f"{group_id}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    try:
        df.to_excel(temp_file, index=False, engine='openpyxl')

        return FileResponse(
            path=temp_file,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename=f"{group_id}.xlsx"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export group: {str(e)}"
        )
