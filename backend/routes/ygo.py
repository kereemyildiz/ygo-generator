"""
YGÖ Generation Routes
API endpoints for generating Software Requirement Specifications using OpenAI.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from services.ygo_generator import ygo_generator
from services.group_manager import group_manager
from services.job_manager import job_manager, JobStatus


router = APIRouter(prefix="/api/ygo", tags=["ygo"])


# Request/Response Models
class YGOGenerateRequest(BaseModel):
    """Request model for single group YGÖ generation."""
    group_id: str
    item_ids: Optional[List[str]] = None  # None or empty list = all items


class YGOBatchRequest(BaseModel):
    """Request model for batch YGÖ generation."""
    group_ids: List[str]


class YGOResponse(BaseModel):
    """Response model for YGÖ generation."""
    job_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    """Response model for job status check."""
    job_id: str
    job_type: str
    description: str
    status: str
    progress: int
    total_items: int
    processed_items: int
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


# Background task functions
async def generate_ygo_task(job_id: str, group_id: str, item_ids: Optional[List[str]]):
    """
    Background task to generate YGÖ for a single group.

    Args:
        job_id: Job ID for tracking
        group_id: Group ID to generate YGÖ for
        item_ids: Optional list of item IDs (None = all items)
    """
    try:
        # Update job status to running
        job_manager.update_job_status(job_id, JobStatus.RUNNING)

        # Get group
        group = group_manager.get_group(group_id)
        if not group:
            raise Exception(f"Group {group_id} not found")

        # Get items (selected or all)
        if item_ids:
            items = [item for item in group['items'] if item['id'] in item_ids]
        else:
            items = group['items']

        if not items:
            raise Exception("No items found for YGÖ generation")

        # Update progress
        job_manager.update_job_progress(job_id, 0)

        # Generate YGÖ
        if not ygo_generator:
            raise Exception("YGÖ Generator not initialized. Please configure OPENAI_API_KEY.")

        ygo_text = await ygo_generator.generate_ygo(
            items=items,
            group_name=group['group_name']
        )

        # Debug logging
        print(f"🔍 DEBUG: Generated YGÖ for job {job_id}")
        print(f"  - Group: {group['group_name']}")
        print(f"  - Items processed: {len(items)}")
        print(f"  - YGÖ text length: {len(ygo_text) if ygo_text else 0}")
        print(f"  - YGÖ text type: {type(ygo_text)}")
        print(f"  - YGÖ text preview: {ygo_text[:200] if ygo_text else 'EMPTY'}")

        # Update progress to complete
        job_manager.update_job_progress(job_id, len(items))

        # Complete job with result (include input items for clear INPUTS vs OUTPUT display)
        result = {
            "group_id": group_id,
            "group_name": group['group_name'],
            "ygo_text": ygo_text,
            "items_processed": len(items),
            "total_items": len(group['items']),
            "input_items": items  # Include input items so frontend can show what went IN
        }

        print(f"🔍 DEBUG: Result structure for job {job_id}:")
        print(f"  - Result keys: {list(result.keys())}")
        print(f"  - Result ygo_text type: {type(result.get('ygo_text'))}")
        print(f"  - Result ygo_text length: {len(result.get('ygo_text', ''))}")

        job_manager.complete_job(job_id, result)

    except Exception as e:
        job_manager.fail_job(job_id, str(e))


async def generate_ygo_batch_task(job_id: str, group_ids: List[str]):
    """
    Background task to generate YGÖ for multiple groups.

    Args:
        job_id: Job ID for tracking
        group_ids: List of group IDs
    """
    try:
        # Update job status to running
        job_manager.update_job_status(job_id, JobStatus.RUNNING)

        # Get all groups
        groups = []
        for gid in group_ids:
            group = group_manager.get_group(gid)
            if group:
                groups.append(group)

        if not groups:
            raise Exception("No valid groups found")

        # Generate YGÖ for each group
        if not ygo_generator:
            raise Exception("YGÖ Generator not initialized. Please configure OPENAI_API_KEY.")

        results = []
        for idx, group in enumerate(groups):
            try:
                ygo_text = await ygo_generator.generate_ygo(
                    items=group['items'],
                    group_name=group['group_name']
                )

                results.append({
                    "group_id": group['group_id'],
                    "group_name": group['group_name'],
                    "ygo_text": ygo_text,
                    "items_processed": len(group['items']),
                    "input_items": group['items'],  # Include input items for clear display
                    "status": "success"
                })

            except Exception as e:
                results.append({
                    "group_id": group['group_id'],
                    "group_name": group['group_name'],
                    "error": str(e),
                    "status": "failed"
                })

            # Update progress
            job_manager.update_job_progress(job_id, idx + 1)

        # Complete job with results
        job_manager.complete_job(job_id, {
            "groups_processed": len(results),
            "total_groups": len(group_ids),
            "results": results
        })

    except Exception as e:
        job_manager.fail_job(job_id, str(e))


# API Endpoints
@router.post("/generate", response_model=YGOResponse)
async def generate_ygo(request: YGOGenerateRequest, background_tasks: BackgroundTasks):
    """
    Generate YGÖ for a single group (async with job tracking).

    Args:
        request: YGOGenerateRequest with group_id and optional item_ids
        background_tasks: FastAPI background tasks

    Returns:
        YGOResponse with job ID
    """
    # Check if OpenAI is configured
    if not ygo_generator:
        raise HTTPException(
            status_code=500,
            detail="YGÖ Generator not configured. Please set OPENAI_API_KEY in .env file."
        )

    # Verify group exists
    group = group_manager.get_group(request.group_id)
    if not group:
        raise HTTPException(status_code=404, detail=f"Group {request.group_id} not found")

    # Get items count
    if request.item_ids:
        items_count = len([item for item in group['items'] if item['id'] in request.item_ids])
    else:
        items_count = len(group['items'])

    if items_count == 0:
        raise HTTPException(status_code=400, detail="No items selected for YGÖ generation")

    # Create job
    description = f"YGÖ üretimi: {group['group_name']} ({items_count} madde)"
    job_id = job_manager.create_job(
        job_type="ygo_single",
        description=description,
        total_items=items_count
    )

    # Add background task
    background_tasks.add_task(
        generate_ygo_task,
        job_id=job_id,
        group_id=request.group_id,
        item_ids=request.item_ids
    )

    return YGOResponse(
        job_id=job_id,
        status="started",
        message=f"YGÖ üretimi başlatıldı: {items_count} madde işlenecek"
    )


@router.post("/generate-batch", response_model=YGOResponse)
async def generate_ygo_batch(request: YGOBatchRequest, background_tasks: BackgroundTasks):
    """
    Generate YGÖ for multiple groups (batch processing with job tracking).

    Args:
        request: YGOBatchRequest with list of group_ids
        background_tasks: FastAPI background tasks

    Returns:
        YGOResponse with job ID
    """
    # Check if OpenAI is configured
    if not ygo_generator:
        raise HTTPException(
            status_code=500,
            detail="YGÖ Generator not configured. Please set OPENAI_API_KEY in .env file."
        )

    if not request.group_ids:
        raise HTTPException(status_code=400, detail="No groups specified")

    # Verify groups exist
    valid_groups = []
    for gid in request.group_ids:
        group = group_manager.get_group(gid)
        if group:
            valid_groups.append(group)

    if not valid_groups:
        raise HTTPException(status_code=404, detail="No valid groups found")

    # Create job
    description = f"Toplu YGÖ üretimi: {len(valid_groups)} grup"
    job_id = job_manager.create_job(
        job_type="ygo_batch",
        description=description,
        total_items=len(valid_groups)
    )

    # Add background task
    background_tasks.add_task(
        generate_ygo_batch_task,
        job_id=job_id,
        group_ids=request.group_ids
    )

    return YGOResponse(
        job_id=job_id,
        status="started",
        message=f"Toplu YGÖ üretimi başlatıldı: {len(valid_groups)} grup işlenecek"
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get status of a YGÖ generation job.

    Args:
        job_id: Job ID to check

    Returns:
        JobStatusResponse with job status and result
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Debug logging
    if job.get('status') == 'completed':
        print(f"🔍 DEBUG: Returning completed job status for {job_id}")
        print(f"  - Job keys: {list(job.keys())}")
        print(f"  - Result type: {type(job.get('result'))}")
        if isinstance(job.get('result'), dict):
            print(f"  - Result keys: {list(job['result'].keys())}")
            print(f"  - ygo_text length: {len(job['result'].get('ygo_text', ''))}")
            print(f"  - ygo_text preview: {job['result'].get('ygo_text', '')[:100]}")

    return JobStatusResponse(**job)


@router.get("/jobs")
async def get_all_jobs():
    """
    Get all YGÖ generation jobs.

    Returns:
        List of all jobs
    """
    jobs = job_manager.get_all_jobs()
    return {"jobs": jobs, "total": len(jobs)}


@router.get("/health")
async def health_check():
    """
    Check if YGÖ generation service is healthy.

    Returns:
        Health status
    """
    is_configured = ygo_generator is not None

    return {
        "status": "healthy" if is_configured else "not_configured",
        "openai_configured": is_configured,
        "message": "YGÖ service is ready" if is_configured else "OPENAI_API_KEY not configured"
    }
