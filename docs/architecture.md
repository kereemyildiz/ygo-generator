# ASEL Trace - High-Level Architecture Documentation

## Table of Contents
1. [System Architecture (Current)](#1-system-architecture-current)
2. [System Architecture (Future - With Database)](#2-system-architecture-future)
3. [Component Diagram](#3-component-diagram)
4. [Data Flow Diagram](#4-data-flow-diagram)
5. [Deployment Architecture](#5-deployment-architecture)
6. [Technology Stack](#6-technology-stack)

---

## 1. System Architecture (Current)

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end

    subgraph "Frontend - React SPA"
        UI[React UI Components]
        Context[Context API State]
        Router[React Router]

        UI --> Context
        Context --> Router
    end

    subgraph "Backend - FastAPI"
        API[FastAPI REST API]
        Parser[Excel Parser Service]
        Analyzer[Link Analysis Engine]
        Exporter[Export Service]

        API --> Parser
        API --> Analyzer
        API --> Exporter
    end

    subgraph "Storage Layer"
        Files[(Uploaded Files<br/>uploads/)]
        JSON[(Groups Data<br/>groups.json)]
    end

    subgraph "External Libraries"
        NetworkX[NetworkX<br/>Graph Analysis]
        Pandas[Pandas<br/>Data Processing]
        OpenPyXL[OpenPyXL<br/>Excel I/O]
    end

    Browser --> UI
    UI --> API
    API --> Files
    API --> JSON
    Analyzer --> NetworkX
    Parser --> Pandas
    Parser --> OpenPyXL
    Exporter --> OpenPyXL

    style Browser fill:#e1f5ff
    style UI fill:#fff4e1
    style API fill:#ffe1f5
    style Files fill:#e1ffe1
    style JSON fill:#e1ffe1
```

### Current Architecture Characteristics

**Strengths:**
- ✅ Simple deployment (no database setup)
- ✅ Fast development iteration
- ✅ Easy backup (copy files and JSON)
- ✅ Low infrastructure requirements

**Limitations:**
- ❌ No user authentication/authorization
- ❌ No audit trail
- ❌ File-based storage not scalable
- ❌ No concurrent user support
- ❌ Risk of data corruption with simultaneous writes

---

## 2. System Architecture (Future)

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end

    subgraph "Frontend - React SPA"
        UI[React UI Components]
        Context[Context API State]
        Router[React Router]
        Auth[Auth Context]

        UI --> Context
        Context --> Router
        UI --> Auth
    end

    subgraph "API Gateway / Load Balancer"
        LB[Nginx / HAProxy]
    end

    subgraph "Backend - FastAPI Cluster"
        API1[FastAPI Instance 1]
        API2[FastAPI Instance 2]
        API3[FastAPI Instance N]

        subgraph "Services Layer"
            AuthService[Authentication Service]
            UserService[User Management]
            FileService[File Management]
            GroupService[Group Management]
            AnalysisService[Link Analysis]
            ExportService[Export Service]
            AuditService[Audit Logging]
        end

        API1 --> AuthService
        API1 --> FileService
        API1 --> GroupService
        API1 --> AnalysisService
    end

    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        FileStore[(File Storage<br/>uploads/)]
        Cache[(Redis Cache<br/>Session/Tokens)]
    end

    subgraph "Security Layer"
        LDAP[ASELSAN LDAP<br/>Active Directory]
        JWT[JWT Token Manager]
    end

    subgraph "External Libraries"
        NetworkX[NetworkX]
        Pandas[Pandas]
        OpenPyXL[OpenPyXL]
        SQLAlchemy[SQLAlchemy ORM]
    end

    Browser --> LB
    LB --> API1
    LB --> API2
    LB --> API3

    AuthService --> LDAP
    AuthService --> JWT
    AuthService --> Cache

    UserService --> DB
    FileService --> DB
    FileService --> FileStore
    GroupService --> DB
    AuditService --> DB

    AnalysisService --> NetworkX
    FileService --> Pandas
    GroupService --> SQLAlchemy

    style Browser fill:#e1f5ff
    style LB fill:#ffe1e1
    style API1 fill:#ffe1f5
    style DB fill:#e1ffe1
    style LDAP fill:#fff4e1
    style Cache fill:#f5e1ff
```

### Future Architecture Characteristics

**Benefits:**
- ✅ Multi-user support with authentication
- ✅ Role-based access control (RBAC)
- ✅ Audit trail for compliance
- ✅ Horizontal scalability (multiple instances)
- ✅ Session management with Redis
- ✅ Corporate SSO integration (LDAP)
- ✅ Data consistency with ACID transactions

---

## 3. Component Diagram

```mermaid
graph LR
    subgraph "Frontend Components"
        Header[Header Component]
        FileUpload[File Upload]
        FileExplorer[File Explorer]
        FileViewer[File Viewer Modal]
        GroupList[Group List]
        GroupCard[Group Card]
        OrphanedItems[Orphaned Items]

        Header --> FileUpload
        FileUpload --> FileExplorer
        FileExplorer --> FileViewer
        FileUpload --> GroupList
        GroupList --> GroupCard
        FileUpload --> OrphanedItems
    end

    subgraph "Context Providers"
        AppContext[App Context<br/>Global State]
        ThemeContext[Theme Context<br/>Dark/Light Mode]
        ToastContext[Toast Context<br/>Notifications]
        ConfirmContext[Confirm Context<br/>Dialogs]

        AppContext --> FileUpload
        AppContext --> GroupList
        ThemeContext --> Header
        ToastContext --> FileUpload
        ConfirmContext --> GroupCard
    end

    subgraph "Backend Routes"
        UploadRoute[/api/upload<br/>File Upload]
        FilesRoute[/api/files<br/>File Management]
        AnalyzeRoute[/api/analyze<br/>Link Analysis]
        GroupsRoute[/api/groups<br/>Group CRUD]
        ItemsRoute[/api/items<br/>Item Management]
        ExportRoute[/api/export<br/>Data Export]
    end

    subgraph "Backend Services"
        ExcelParser[Excel Parser<br/>pandas + openpyxl]
        LinkAnalyzer[Link Analyzer<br/>NetworkX]
        GroupManager[Group Manager<br/>CRUD Operations]
        FileManager[File Manager<br/>I/O Operations]
        Exporter[Export Service<br/>JSON + Excel]
    end

    FileUpload -.HTTP.-> UploadRoute
    FileExplorer -.HTTP.-> FilesRoute
    FileUpload -.HTTP.-> AnalyzeRoute
    GroupList -.HTTP.-> GroupsRoute
    GroupCard -.HTTP.-> ItemsRoute
    GroupCard -.HTTP.-> ExportRoute

    UploadRoute --> FileManager
    FilesRoute --> FileManager
    AnalyzeRoute --> ExcelParser
    AnalyzeRoute --> LinkAnalyzer
    GroupsRoute --> GroupManager
    ExportRoute --> Exporter

    style FileUpload fill:#e1f5ff
    style GroupCard fill:#e1f5ff
    style AppContext fill:#fff4e1
    style UploadRoute fill:#ffe1f5
    style ExcelParser fill:#e1ffe1
```

---

## 4. Data Flow Diagram

### 4.1 File Upload & Analysis Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as FastAPI
    participant Parser as Excel Parser
    participant Analyzer as Link Analyzer
    participant Storage as File Storage
    participant DB as groups.json

    User->>UI: Select Excel files
    User->>UI: Click "Upload"

    UI->>API: POST /api/upload (multipart/form-data)
    API->>Storage: Save files to uploads/
    API-->>UI: 200 OK {filenames}
    UI->>UI: Update file list

    User->>UI: Click "Analyze Links"
    UI->>API: POST /api/analyze

    API->>Parser: Parse all Excel files
    Parser->>Parser: Extract items & columns
    Parser->>Parser: Detect ID columns
    Parser->>Parser: Detect link columns

    API->>Analyzer: Build graph (NetworkX)
    Analyzer->>Analyzer: Create nodes (items)
    Analyzer->>Analyzer: Create edges (links)
    Analyzer->>Analyzer: Find connected components

    Analyzer->>DB: Save groups to groups.json
    API-->>UI: 200 OK {groups, stats}
    UI->>UI: Display groups
```

### 4.2 Group Management Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as GroupCard
    participant API as FastAPI
    participant Manager as Group Manager
    participant DB as groups.json

    User->>UI: Expand group
    UI->>UI: Render virtualized list

    User->>UI: Select items
    UI->>UI: Update selection state

    User->>UI: Click "Remove Item"
    UI->>UI: Show confirm dialog
    User->>UI: Confirm removal

    UI->>API: DELETE /api/groups/{id}/items/{item_id}
    API->>Manager: Remove item from group
    Manager->>DB: Update groups.json
    Manager->>Manager: Check if group empty
    Manager->>DB: Delete group if empty
    API-->>UI: 200 OK

    UI->>API: GET /api/groups (refresh)
    API->>DB: Read groups.json
    API-->>UI: Updated groups
    UI->>UI: Re-render
```

### 4.3 Export Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as GroupCard
    participant API as FastAPI
    participant Exporter as Export Service
    participant Storage as File System

    User->>UI: Click "Export Excel"
    UI->>API: GET /api/export/group/{id}/excel

    API->>Exporter: Generate Excel workbook
    Exporter->>Exporter: Create workbook
    Exporter->>Exporter: Add group metadata sheet
    Exporter->>Exporter: Add items sheet with data
    Exporter->>Exporter: Add links sheet
    Exporter->>Exporter: Format cells

    API-->>UI: Binary Excel file
    UI->>Storage: Browser download

    Note over User,Storage: Alternative: JSON Export
    User->>UI: Click "Export JSON"
    UI->>API: GET /api/export/group/{id}/json
    API->>Exporter: Serialize to JSON
    API-->>UI: JSON file
    UI->>Storage: Browser download
```

---

## 5. Deployment Architecture

### 5.1 Current Deployment (Development/Staging)

```mermaid
graph TB
    subgraph "ASELSAN Intranet Server"
        subgraph "Docker Containers"
            Frontend[Frontend Container<br/>Nginx + React Build<br/>Port 80/443]
            Backend[Backend Container<br/>FastAPI + Uvicorn<br/>Port 8000]
        end

        subgraph "Volumes"
            Uploads[/uploads<br/>Persistent Volume]
            Data[/data<br/>groups.json]
        end

        Frontend --> Backend
        Backend --> Uploads
        Backend --> Data
    end

    subgraph "Client Workstations"
        Engineer1[Engineer Browser]
        Engineer2[Engineer Browser]
        Engineer3[Engineer Browser]
    end

    Engineer1 --> Frontend
    Engineer2 --> Frontend
    Engineer3 --> Frontend

    style Frontend fill:#e1f5ff
    style Backend fill:#ffe1f5
    style Uploads fill:#e1ffe1
```

**Docker Compose Setup:**
```yaml
services:
  frontend:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf

  backend:
    image: python:3.11
    ports: ["8000:8000"]
    volumes:
      - ./backend:/app
      - uploads:/app/uploads
      - data:/app/data
    command: uvicorn main:app --host 0.0.0.0
```

### 5.2 Future Deployment (Production with Database)

```mermaid
graph TB
    subgraph "External Access"
        Users[Engineers & Managers]
    end

    subgraph "Load Balancer / Reverse Proxy"
        LB[Nginx / HAProxy<br/>SSL Termination<br/>Port 443]
    end

    subgraph "Application Tier"
        API1[FastAPI Instance 1<br/>Port 8001]
        API2[FastAPI Instance 2<br/>Port 8002]
        API3[FastAPI Instance 3<br/>Port 8003]
    end

    subgraph "Data Tier"
        Primary[(PostgreSQL Primary<br/>Port 5432)]
        Replica[(PostgreSQL Replica<br/>Read-Only)]
        Redis[(Redis Cache<br/>Port 6379)]
        FileStore[Shared File Storage<br/>NFS / S3-compatible]
    end

    subgraph "Authentication"
        LDAP[ASELSAN LDAP<br/>Port 389/636]
    end

    subgraph "Monitoring & Logging"
        Prometheus[Prometheus<br/>Metrics]
        Grafana[Grafana<br/>Dashboards]
        ELK[ELK Stack<br/>Log Aggregation]
    end

    Users --> LB
    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> Primary
    API2 --> Primary
    API3 --> Primary

    API1 --> Replica
    API2 --> Replica
    API3 --> Replica

    API1 --> Redis
    API2 --> Redis
    API3 --> Redis

    API1 --> FileStore
    API2 --> FileStore
    API3 --> FileStore

    API1 --> LDAP
    API2 --> LDAP
    API3 --> LDAP

    Primary --> Replica

    API1 --> Prometheus
    API2 --> Prometheus
    API3 --> Prometheus
    Prometheus --> Grafana

    API1 --> ELK
    API2 --> ELK
    API3 --> ELK

    style Users fill:#e1f5ff
    style LB fill:#ffe1e1
    style Primary fill:#e1ffe1
    style LDAP fill:#fff4e1
```

**Production Infrastructure Requirements:**
- **Load Balancer**: 1 instance (Nginx/HAProxy)
- **Application Servers**: 3+ instances (horizontal scaling)
- **Database**: 1 Primary + 1 Replica (HA setup)
- **Cache**: 1 Redis instance (or cluster)
- **File Storage**: NFS share or S3-compatible storage
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK stack or similar

---

## 6. Technology Stack

### Frontend Stack
```
├── React 18                    # UI Framework
├── Vite                        # Build Tool
├── Tailwind CSS                # Styling
├── react-window                # Virtualization
├── lucide-react                # Icons
├── react-dropzone              # File Upload
└── Context API                 # State Management
```

### Backend Stack
```
├── Python 3.11+                # Runtime
├── FastAPI                     # Web Framework
├── Uvicorn                     # ASGI Server
├── Pydantic                    # Data Validation
├── pandas                      # Data Processing
├── openpyxl                    # Excel I/O
├── NetworkX                    # Graph Analysis
├── SQLAlchemy (Future)         # ORM
├── Alembic (Future)            # Migrations
└── python-ldap (Future)        # LDAP Auth
```

### Infrastructure
```
├── Docker & Docker Compose     # Containerization
├── PostgreSQL (Future)         # Database
├── Redis (Future)              # Cache
├── Nginx                       # Web Server / Reverse Proxy
├── ASELSAN LDAP                # Authentication
└── Git                         # Version Control
```

### Development Tools
```
├── Git                         # Version Control
├── npm                         # Package Manager (Frontend)
├── pip / Poetry                # Package Manager (Backend)
├── ESLint                      # Linting (Frontend)
├── Black                       # Formatting (Backend)
└── pytest                      # Testing (Backend)
```

---

## 7. Security Considerations

### Current Security Measures
- ✅ CORS configuration
- ✅ Input validation with Pydantic
- ✅ File type validation (.xlsx, .xls only)
- ⚠️ No authentication/authorization
- ⚠️ No audit logging
- ⚠️ No rate limiting

### Future Security Enhancements
- ✅ LDAP authentication with corporate credentials
- ✅ JWT token-based session management
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all operations
- ✅ Rate limiting per user
- ✅ SQL injection protection (SQLAlchemy ORM)
- ✅ XSS protection (React + CSP headers)
- ✅ HTTPS/TLS encryption
- ✅ Secure file upload validation
- ✅ Database connection pooling with SSL

---

## 8. Performance Optimizations

### Frontend
- ✅ **Virtualization**: react-window for large lists (1000+ items)
- ✅ **Code Splitting**: Dynamic imports with React.lazy
- ✅ **Memoization**: React.memo for expensive components
- ✅ **Debouncing**: Search input with debounce
- ✅ **Lazy Loading**: Images and components on demand

### Backend
- ✅ **Async I/O**: FastAPI async/await for non-blocking operations
- 🔄 **Database Indexing**: Strategic indexes on frequently queried columns
- 🔄 **Connection Pooling**: Reuse database connections
- 🔄 **Caching**: Redis for frequently accessed data
- 🔄 **Pagination**: Limit result sets for large queries

### Infrastructure
- 🔄 **CDN**: Static asset caching
- 🔄 **Compression**: Gzip/Brotli for HTTP responses
- 🔄 **Load Balancing**: Distribute traffic across instances
- 🔄 **Database Replication**: Read replicas for query distribution

Legend: ✅ Implemented | 🔄 Planned for future

---

## Document Version
- **Version**: 1.0
- **Last Updated**: 2025-01-04
- **Author**: Development Team
- **Status**: Living Document

