"""
File Explorer Routes
Handles file viewing, stats, and data pagination for large datasets.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pathlib import Path
from typing import Optional
import math
import json

from services.excel_parser import parse_excel_file


router = APIRouter(prefix="/api/files", tags=["files"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"


def sanitize_for_json(obj):
    """
    Recursively sanitize an object to be JSON-serializable.
    Converts NaN, Infinity to None.
    """
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif obj is None:
        return None
    elif isinstance(obj, (str, int, bool)):
        return obj
    else:
        # For any other type, try to convert to string
        try:
            return str(obj)
        except:
            return None


@router.get("/{filename}/stats")
async def get_file_stats(filename: str):
    """
    Get statistics about a file without loading all data.

    Args:
        filename: Name of the Excel file

    Returns:
        File statistics including row count, columns, orphaned items
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {filename}"
        )

    try:
        # Parse the file
        parsed = parse_excel_file(str(file_path))

        # Calculate orphaned items (items with no links)
        orphaned_count = 0
        for item in parsed['items']:
            if not item.get('in_links') and not item.get('out_links'):
                orphaned_count += 1

        result = {
            'filename': filename,
            'total_rows': parsed['total_items'],
            'id_column': parsed['id_column'],
            'in_link_column': parsed['in_link_column'],
            'out_link_column': parsed['out_link_column'],
            'orphaned_count': orphaned_count,
            'columns': list(parsed['items'][0]['data'].keys()) if parsed['items'] else []
        }

        sanitized = sanitize_for_json(result)
        json_str = json.dumps(sanitized)
        return Response(content=json_str, media_type="application/json")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get file stats: {str(e)}"
        )


@router.get("/{filename}/data")
async def get_file_data(
    filename: str,
    offset: int = 0,
    limit: int = 100,
    filter_orphaned: Optional[bool] = None,
    search: Optional[str] = None
):
    """
    Get paginated data from a file.

    Args:
        filename: Name of the Excel file
        offset: Starting index (for pagination)
        limit: Number of items to return
        filter_orphaned: If True, only return orphaned items
        search: Search term to filter items

    Returns:
        Paginated items data
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {filename}"
        )

    try:
        # Parse the file
        parsed = parse_excel_file(str(file_path))
        items = parsed['items']

        # Filter orphaned items if requested
        if filter_orphaned:
            items = [
                item for item in items
                if not item.get('in_links') and not item.get('out_links')
            ]

        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            items = [
                item for item in items
                if any(
                    search_lower in str(value).lower()
                    for value in item['data'].values()
                )
            ]

        # Apply pagination
        total = len(items)
        paginated_items = items[offset:offset + limit]

        result = {
            'items': paginated_items,
            'total': total,
            'offset': offset,
            'limit': limit,
            'has_more': offset + limit < total
        }

        sanitized = sanitize_for_json(result)
        json_str = json.dumps(sanitized)
        return Response(content=json_str, media_type="application/json")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get file data: {str(e)}"
        )


@router.get("/{filename}/all")
async def get_file_all_data(filename: str):
    """
    Get all data from a file (for client-side virtual scrolling).
    Use with caution for large files.

    Args:
        filename: Name of the Excel file

    Returns:
        All items from the file
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {filename}"
        )

    try:
        # Parse the file
        parsed = parse_excel_file(str(file_path))

        result = {
            'filename': filename,
            'items': parsed['items'],
            'total': parsed['total_items'],
            'columns': list(parsed['items'][0]['data'].keys()) if parsed['items'] else []
        }

        sanitized = sanitize_for_json(result)
        json_str = json.dumps(sanitized)
        return Response(content=json_str, media_type="application/json")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get file data: {str(e)}"
        )
