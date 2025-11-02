"""
File Upload Routes
Handles file upload and listing operations.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import os
from pathlib import Path
import shutil

from models.schemas import FileUploadResponse, FileListResponse, AnalysisRequest, AnalysisResponse
from services.excel_parser import parse_multiple_files
from services.link_analyzer import analyze_links, get_group_statistics
from services.group_manager import group_manager


router = APIRouter(prefix="/api", tags=["upload"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=FileUploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload one or more Excel files.

    Args:
        files: List of files to upload

    Returns:
        FileUploadResponse with list of uploaded files
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    uploaded_files = []

    for file in files:
        # Validate file extension
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.filename}. Only Excel files (.xlsx, .xls) are allowed."
            )

        # Save file
        file_path = UPLOAD_DIR / file.filename

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_files.append(file.filename)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload {file.filename}: {str(e)}"
            )

    return FileUploadResponse(
        message=f"Successfully uploaded {len(uploaded_files)} file(s)",
        files_uploaded=uploaded_files,
        total_files=len(uploaded_files)
    )


@router.get("/files", response_model=FileListResponse)
async def list_files():
    """
    List all uploaded Excel files.

    Returns:
        FileListResponse with list of uploaded files
    """
    try:
        files = [f.name for f in UPLOAD_DIR.glob("*.xlsx")]
        files.extend([f.name for f in UPLOAD_DIR.glob("*.xls")])
        files.sort()

        return FileListResponse(
            files=files,
            total_files=len(files)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list files: {str(e)}"
        )


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_files(request: AnalysisRequest = None):
    """
    Analyze uploaded Excel files and create groups based on link relationships.

    Args:
        request: Optional AnalysisRequest with specific file paths

    Returns:
        AnalysisResponse with analysis results
    """
    # Get files to analyze
    if request and request.file_paths:
        file_paths = [UPLOAD_DIR / Path(fp).name for fp in request.file_paths]
    else:
        # Analyze all uploaded files
        file_paths = list(UPLOAD_DIR.glob("*.xlsx"))
        file_paths.extend(list(UPLOAD_DIR.glob("*.xls")))

    if not file_paths:
        raise HTTPException(
            status_code=400,
            detail="No files to analyze. Please upload files first."
        )

    # Convert to strings
    file_paths_str = [str(fp) for fp in file_paths]

    try:
        # Parse files
        parsed_data = parse_multiple_files(file_paths_str)

        if parsed_data['total_items'] == 0:
            raise HTTPException(
                status_code=400,
                detail="No items found in the uploaded files"
            )

        # Analyze links and create groups
        analysis = analyze_links(parsed_data['all_items'])

        # Clear existing groups and load new ones
        group_manager.clear_all_groups()
        group_manager.load_groups(analysis['groups'])

        # Get statistics
        stats = get_group_statistics(analysis['groups'])

        return AnalysisResponse(
            message="Analysis completed successfully",
            groups_created=analysis['total_groups'],
            total_items_analyzed=analysis['total_items'],
            orphaned_items=analysis['total_orphaned'],
            statistics=stats
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.delete("/files/{filename}")
async def delete_file(filename: str):
    """
    Delete an uploaded file.

    Args:
        filename: Name of the file to delete

    Returns:
        Success message
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {filename}"
        )

    try:
        file_path.unlink()
        return {"message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )
