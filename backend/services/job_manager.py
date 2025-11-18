"""
Job Manager Service
Manages background jobs for long-running operations like YGÖ generation.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum
import uuid


class JobStatus(str, Enum):
    """Job status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobManager:
    """
    Manages background jobs with status tracking.
    """

    def __init__(self):
        """Initialize the job manager with empty storage."""
        self.jobs = {}  # Dict of job_id -> job data

    def create_job(self, job_type: str, description: str, total_items: int = 0) -> str:
        """
        Create a new job.

        Args:
            job_type: Type of job (e.g., 'ygo_single', 'ygo_batch')
            description: Human-readable description
            total_items: Total number of items to process

        Returns:
            Job ID
        """
        job_id = str(uuid.uuid4())

        job = {
            'job_id': job_id,
            'job_type': job_type,
            'description': description,
            'status': JobStatus.PENDING,
            'progress': 0,
            'total_items': total_items,
            'processed_items': 0,
            'result': None,
            'error': None,
            'created_at': datetime.now().isoformat(),
            'started_at': None,
            'completed_at': None
        }

        self.jobs[job_id] = job
        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job by ID.

        Args:
            job_id: The job ID

        Returns:
            Job data or None if not found
        """
        return self.jobs.get(job_id)

    def update_job_status(self, job_id: str, status: JobStatus) -> None:
        """
        Update job status.

        Args:
            job_id: The job ID
            status: New status
        """
        if job_id in self.jobs:
            self.jobs[job_id]['status'] = status

            if status == JobStatus.RUNNING and not self.jobs[job_id]['started_at']:
                self.jobs[job_id]['started_at'] = datetime.now().isoformat()
            elif status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                self.jobs[job_id]['completed_at'] = datetime.now().isoformat()

    def update_job_progress(self, job_id: str, processed_items: int) -> None:
        """
        Update job progress.

        Args:
            job_id: The job ID
            processed_items: Number of items processed so far
        """
        if job_id in self.jobs:
            job = self.jobs[job_id]
            job['processed_items'] = processed_items

            if job['total_items'] > 0:
                job['progress'] = int((processed_items / job['total_items']) * 100)
            else:
                job['progress'] = 0

    def complete_job(self, job_id: str, result: Any) -> None:
        """
        Mark job as completed with result.

        Args:
            job_id: The job ID
            result: Job result data
        """
        if job_id in self.jobs:
            print(f"🔍 DEBUG: JobManager.complete_job called for {job_id}")
            print(f"  - Result type: {type(result)}")
            print(f"  - Result keys: {list(result.keys()) if isinstance(result, dict) else 'NOT A DICT'}")
            if isinstance(result, dict):
                print(f"  - ygo_text in result: {'ygo_text' in result}")
                print(f"  - ygo_text type: {type(result.get('ygo_text'))}")
                print(f"  - ygo_text length: {len(result.get('ygo_text', ''))}")

            self.jobs[job_id]['result'] = result
            self.update_job_status(job_id, JobStatus.COMPLETED)

            print(f"🔍 DEBUG: Job {job_id} stored result")
            print(f"  - Stored result ygo_text length: {len(self.jobs[job_id]['result'].get('ygo_text', '')) if isinstance(self.jobs[job_id]['result'], dict) else 'N/A'}")

    def fail_job(self, job_id: str, error: str) -> None:
        """
        Mark job as failed with error message.

        Args:
            job_id: The job ID
            error: Error message
        """
        if job_id in self.jobs:
            self.jobs[job_id]['error'] = error
            self.update_job_status(job_id, JobStatus.FAILED)

    def get_all_jobs(self) -> list[Dict[str, Any]]:
        """
        Get all jobs.

        Returns:
            List of all jobs
        """
        return list(self.jobs.values())

    def clear_old_jobs(self, max_age_hours: int = 24) -> int:
        """
        Clear jobs older than specified hours.

        Args:
            max_age_hours: Maximum age in hours

        Returns:
            Number of jobs cleared
        """
        from datetime import timedelta

        now = datetime.now()
        cleared = 0

        jobs_to_remove = []
        for job_id, job in self.jobs.items():
            created_at = datetime.fromisoformat(job['created_at'])
            age = now - created_at

            if age > timedelta(hours=max_age_hours):
                jobs_to_remove.append(job_id)

        for job_id in jobs_to_remove:
            del self.jobs[job_id]
            cleared += 1

        return cleared


# Global instance
job_manager = JobManager()
