# ASEL Trace - API Documentation

## Base URL
```
Development: http://localhost:8000
Production: https://asel-trace.aselsan.com.tr
```

## API Version
Current Version: **v1** (implicit in routes)

---

## Table of Contents
1. [File Management](#1-file-management)
2. [Analysis](#2-analysis)
3. [Group Management](#3-group-management)
4. [Item Management](#4-item-management)
5. [Export](#5-export)
6. [Statistics](#6-statistics)
7. [Authentication (Future)](#7-authentication-future)

---

## 1. File Management

### 1.1 Upload Files

Upload one or more Excel files.

**Endpoint:** `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Request:**
```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="requirements.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

[binary data]
------WebKitFormBoundary--
```

**Response:** `200 OK`
```json
{
  "message": "2 file(s) uploaded successfully",
  "filenames": [
    "requirements_20250104_143022.xlsx",
    "test_cases_20250104_143022.xlsx"
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file type
```json
{
  "detail": "Only .xlsx and .xls files are allowed"
}
```

---

### 1.2 List Uploaded Files

Get list of all uploaded files.

**Endpoint:** `GET /api/files`

**Response:** `200 OK`
```json
{
  "files": [
    "requirements_20250104_143022.xlsx",
    "test_cases_20250104_143022.xlsx",
    "use_cases_20250103_091500.xlsx"
  ]
}
```

---

### 1.3 Get File Details

Get detailed information about a specific file.

**Endpoint:** `GET /api/files/{filename}`

**Response:** `200 OK`
```json
{
  "filename": "requirements_20250104_143022.xlsx",
  "sheets": [
    {
      "sheet_name": "Requirements",
      "row_count": 150,
      "columns": ["REQ_ID", "Requirement Title", "Description", "Priority", "Links"],
      "sample_data": [
        {
          "REQ_ID": "REQ-001",
          "Requirement Title": "User Authentication",
          "Description": "System shall authenticate users",
          "Priority": "High",
          "Links": "UC-001, UC-002"
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - File doesn't exist
```json
{
  "detail": "File not found"
}
```

---

### 1.4 Delete File

Delete an uploaded file.

**Endpoint:** `DELETE /api/files/{filename}`

**Response:** `200 OK`
```json
{
  "message": "File deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - File doesn't exist
- `500 Internal Server Error` - File deletion failed

---

## 2. Analysis

### 2.1 Analyze Links

Analyze all uploaded files and create groups based on link relationships.

**Endpoint:** `POST /api/analyze`

**Request Body:** None

**Process:**
1. Parse all Excel files
2. Extract items and detect ID columns
3. Detect link columns (columns with comma-separated IDs)
4. Build relationship graph using NetworkX
5. Find connected components (groups)
6. Save groups to storage

**Response:** `200 OK`
```json
{
  "message": "Analysis completed successfully",
  "statistics": {
    "total_groups": 15,
    "total_items": 450,
    "orphaned_items": 25,
    "average_items_per_group": 30.0
  },
  "groups": [
    {
      "group_id": "550e8400-e29b-41d4-a716-446655440000",
      "group_name": "Group 1",
      "item_count": 45,
      "items": [
        {
          "id": "REQ-001",
          "source_file": "requirements.xlsx",
          "source_type": "excel",
          "data": {
            "Requirement Title": "User Authentication",
            "Description": "System shall authenticate users",
            "Priority": "High"
          },
          "in_links": [],
          "out_links": ["UC-001", "TC-100"]
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `500 Internal Server Error` - Analysis failed
```json
{
  "detail": "Analysis failed: [error details]"
}
```

---

## 3. Group Management

### 3.1 Get All Groups

Retrieve all groups with their items.

**Endpoint:** `GET /api/groups`

**Response:** `200 OK`
```json
{
  "groups": [
    {
      "group_id": "550e8400-e29b-41d4-a716-446655440000",
      "group_name": "Requirements Group 1",
      "item_count": 45,
      "items": [...]
    }
  ],
  "statistics": {
    "total_groups": 15,
    "total_items": 450,
    "orphaned_items": 25,
    "average_items_per_group": 30.0
  }
}
```

---

### 3.2 Get Single Group

Retrieve a specific group by ID.

**Endpoint:** `GET /api/groups/{group_id}`

**Response:** `200 OK`
```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "group_name": "Requirements Group 1",
  "item_count": 45,
  "items": [
    {
      "id": "REQ-001",
      "source_file": "requirements.xlsx",
      "source_type": "excel",
      "data": {
        "Requirement Title": "User Authentication",
        "Description": "System shall authenticate users"
      },
      "in_links": [],
      "out_links": ["UC-001"]
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Group doesn't exist

---

### 3.3 Update Group

Update group metadata (e.g., name).

**Endpoint:** `PATCH /api/groups/{group_id}`

**Request Body:**
```json
{
  "group_name": "Updated Group Name"
}
```

**Response:** `200 OK`
```json
{
  "message": "Group updated successfully",
  "group": {
    "group_id": "550e8400-e29b-41d4-a716-446655440000",
    "group_name": "Updated Group Name",
    "item_count": 45
  }
}
```

**Error Responses:**
- `404 Not Found` - Group doesn't exist
- `400 Bad Request` - Invalid data

---

### 3.4 Delete Group

Delete a group permanently.

**Endpoint:** `DELETE /api/groups/{group_id}`

**Response:** `200 OK`
```json
{
  "message": "Group deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Group doesn't exist

---

### 3.5 Clear All Groups

Delete all groups (reset system).

**Endpoint:** `DELETE /api/groups`

**Response:** `200 OK`
```json
{
  "message": "All groups cleared successfully"
}
```

---

## 4. Item Management

### 4.1 Get Orphaned Items

Get items that don't belong to any group.

**Endpoint:** `GET /api/items/orphaned`

**Response:** `200 OK`
```json
{
  "orphaned_items": [
    {
      "id": "REQ-999",
      "source_file": "requirements.xlsx",
      "source_type": "excel",
      "data": {
        "Requirement Title": "Isolated Requirement",
        "Description": "This requirement has no links"
      },
      "in_links": [],
      "out_links": []
    }
  ],
  "count": 25
}
```

---

### 4.2 Create Manual Item

Create a new manual item and add to group.

**Endpoint:** `POST /api/groups/{group_id}/items`

**Request Body:**
```json
{
  "title": "Manual Requirement",
  "description": "This is a manually created requirement"
}
```

**Response:** `201 Created`
```json
{
  "message": "Manual item created successfully",
  "item": {
    "id": "MANUAL-001",
    "source_file": "manual",
    "source_type": "manual",
    "data": {
      "Title": "Manual Requirement",
      "Description": "This is a manually created requirement"
    },
    "in_links": [],
    "out_links": []
  }
}
```

**Error Responses:**
- `404 Not Found` - Group doesn't exist
- `400 Bad Request` - Missing required fields

---

### 4.3 Remove Item from Group

Remove an item from its group.

**Endpoint:** `DELETE /api/groups/{group_id}/items/{item_id}`

**Response:** `200 OK`
```json
{
  "message": "Item removed from group successfully"
}
```

**Note:** If the group becomes empty after removal, it will be automatically deleted.

**Error Responses:**
- `404 Not Found` - Group or item doesn't exist

---

### 4.4 Assign Item to Group

Assign an orphaned item to a group.

**Endpoint:** `POST /api/groups/{group_id}/items/{item_id}`

**Response:** `200 OK`
```json
{
  "message": "Item assigned to group successfully"
}
```

**Error Responses:**
- `404 Not Found` - Group or item doesn't exist
- `400 Bad Request` - Item already in a group

---

## 5. Export

### 5.1 Export Group as JSON

Export a group and its items as JSON.

**Endpoint:** `GET /api/export/group/{group_id}/json`

**Response:** `200 OK`
```json
{
  "group_id": "550e8400-e29b-41d4-a716-446655440000",
  "group_name": "Requirements Group 1",
  "export_date": "2025-01-04T14:30:22Z",
  "item_count": 45,
  "items": [
    {
      "id": "REQ-001",
      "source_file": "requirements.xlsx",
      "data": {...},
      "in_links": [],
      "out_links": ["UC-001"]
    }
  ]
}
```

**Headers:**
- `Content-Type: application/json`
- `Content-Disposition: attachment; filename="group_1_20250104.json"`

---

### 5.2 Export Group as Excel

Export a group and its items as Excel workbook.

**Endpoint:** `GET /api/export/group/{group_id}/excel`

**Response:** `200 OK` (Binary Excel file)

**Excel Structure:**
- **Sheet 1: Group Info**
  - Group Name
  - Export Date
  - Total Items
  - Statistics

- **Sheet 2: Items**
  - All item data in tabular format
  - Columns dynamically based on data fields

- **Sheet 3: Links**
  - From Item | To Item | Link Type

**Headers:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="group_1_20250104.xlsx"`

---

### 5.3 Export All Groups as JSON

Export all groups.

**Endpoint:** `GET /api/export/all/json`

**Response:** `200 OK`
```json
{
  "export_date": "2025-01-04T14:30:22Z",
  "total_groups": 15,
  "total_items": 450,
  "groups": [...]
}
```

---

## 6. Statistics

### 6.1 Get System Statistics

Get overall system statistics.

**Endpoint:** `GET /api/statistics`

**Response:** `200 OK`
```json
{
  "total_groups": 15,
  "total_items": 450,
  "orphaned_items": 25,
  "average_items_per_group": 30.0,
  "total_files": 8,
  "total_links": 850,
  "largest_group": {
    "group_id": "550e8400-e29b-41d4-a716-446655440000",
    "group_name": "Main Requirements",
    "item_count": 120
  },
  "file_distribution": {
    "requirements.xlsx": 200,
    "test_cases.xlsx": 150,
    "use_cases.xlsx": 100
  }
}
```

---

## 7. Authentication (Future)

### 7.1 Login

Authenticate user via LDAP.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "ahmet.yilmaz",
  "password": "********"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "ahmet.yilmaz",
    "email": "ahmet.yilmaz@aselsan.com.tr",
    "full_name": "Ahmet Yılmaz",
    "role": "engineer"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
```json
{
  "detail": "Invalid username or password"
}
```

---

### 7.2 Logout

Invalidate user session.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### 7.3 Refresh Token

Get new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

### 7.4 Get Current User

Get authenticated user information.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "ahmet.yilmaz",
  "email": "ahmet.yilmaz@aselsan.com.tr",
  "full_name": "Ahmet Yılmaz",
  "role": "engineer",
  "is_active": true,
  "created_at": "2024-12-01T10:00:00Z",
  "last_login": "2025-01-04T14:30:22Z"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Human-readable error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2025-01-04T14:30:22Z"
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting (Future)

```
Rate Limit: 100 requests per minute per user
Headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1704377422
```

---

## CORS Configuration

**Current (Development):**
```python
origins = ["http://localhost:5173", "http://localhost:3000"]
```

**Future (Production):**
```python
origins = ["https://asel-trace.aselsan.com.tr"]
```

---

## API Client Examples

### JavaScript (Fetch)

```javascript
// Upload files
const formData = new FormData();
formData.append('files', file);

const response = await fetch('http://localhost:8000/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

// Get groups
const { data } = await axios.get('http://localhost:8000/api/groups');

// Delete group
await axios.delete(`http://localhost:8000/api/groups/${groupId}`);

// With authentication (future)
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Python (Requests)

```python
import requests

# Upload file
files = {'files': open('requirements.xlsx', 'rb')}
response = requests.post('http://localhost:8000/api/upload', files=files)

# Get groups
response = requests.get('http://localhost:8000/api/groups')
groups = response.json()

# With authentication (future)
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/api/groups', headers=headers)
```

### cURL

```bash
# Upload file
curl -X POST http://localhost:8000/api/upload \
  -F "files=@requirements.xlsx"

# Get groups
curl http://localhost:8000/api/groups

# Delete group
curl -X DELETE http://localhost:8000/api/groups/{group_id}

# With authentication (future)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/groups
```

---

## Swagger/OpenAPI Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## Versioning Strategy (Future)

When breaking changes are introduced, version the API:

```
/api/v1/groups  (Current)
/api/v2/groups  (Future breaking changes)
```

---

## Document Version
- **Version**: 1.0
- **Last Updated**: 2025-01-04
- **Status**: Living Document

