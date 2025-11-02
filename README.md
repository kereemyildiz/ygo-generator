# SRS Link Manager

A web application for managing linked requirements documents in defense industry context. Upload Excel files containing requirements, use cases, and test scenarios, then automatically analyze and group them based on their link relationships.

## Features

- **File Upload**: Drag-and-drop interface for uploading multiple Excel files (.xlsx, .xls)
- **Link Analysis**: Automatic detection and analysis of In_Link and Out_Link relationships
- **Smart Grouping**: Uses graph theory (NetworkX) to identify connected components
- **Visual Display**: Color-coded groups showing items from different source files
- **Export Options**: Export groups as JSON or Excel files
- **CRUD Operations**: Add/remove items, delete groups, and merge groups
- **Real-time Statistics**: View group counts, item counts, and average group size

## Tech Stack

### Backend
- **FastAPI** (Python 3.11+) - Modern, fast web framework
- **pandas** - Excel file parsing and data manipulation
- **openpyxl** - Excel file reading/writing
- **networkx** - Graph analysis for link relationships
- **uvicorn** - ASGI server

### Frontend
- **React 18** with JavaScript (NO TypeScript)
- **Vite** - Fast build tool and dev server
- **shadcn/ui** - Beautiful UI components with Tailwind CSS
- **axios** - HTTP client for API calls
- **react-dropzone** - File upload functionality
- **lucide-react** - Icon library

## Project Structure

```
srs-link-manager/
├── backend/
│   ├── main.py                    # FastAPI application
│   ├── sample_data/               # Sample Excel files
│   ├── uploads/                   # User uploaded files
│   ├── services/
│   │   ├── excel_parser.py       # Parse Excel, extract data
│   │   ├── link_analyzer.py      # Graph analysis, grouping
│   │   └── group_manager.py      # CRUD operations on groups
│   ├── models/
│   │   └── schemas.py            # Pydantic models
│   ├── routes/
│   │   ├── upload.py             # File upload endpoints
│   │   └── groups.py             # Group management endpoints
│   ├── requirements.txt
│   └── test_services.py          # Service test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   ├── FileUpload.jsx   # File upload component
│   │   │   ├── GroupList.jsx    # List all groups
│   │   │   ├── GroupCard.jsx    # Single group display
│   │   │   └── Header.jsx       # App header
│   │   ├── lib/
│   │   │   ├── api.js           # Axios API calls
│   │   │   └── utils.js         # Helper functions
│   │   ├── context/
│   │   │   └── AppContext.jsx   # Global state
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. (Optional) Test the services with sample data:
```bash
python test_services.py
```

6. Start the FastAPI server:
```bash
python main.py
```

The backend API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/api/docs`
- Alternative Docs: `http://localhost:8000/api/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage Guide

### Step 1: Upload Excel Files

1. Open the application in your browser (`http://localhost:5173`)
2. Drag and drop Excel files into the upload area, or click to browse
3. Click "Upload" to send files to the server

### Step 2: Analyze Links

1. Click the "Analyze Links" button
2. The system will:
   - Parse all uploaded Excel files
   - Detect ID, In_Link, and Out_Link columns
   - Build a graph of relationships
   - Identify connected components (groups)
   - Display the results

### Step 3: View and Manage Groups

- **View Groups**: Groups are displayed as expandable cards
- **Expand/Collapse**: Click the chevron icon to see full details
- **Remove Items**: Click the X button next to any item
- **Delete Group**: Click the trash icon to delete entire group
- **Export**: Download group as JSON or Excel using the export buttons

## Excel File Format

Your Excel files should follow this structure:

### Required Columns:
- **ID Column** (first column): Unique identifier (e.g., SYSR-001, UC-001, TS-001)
- **In_Link** (case-insensitive): Comma-separated IDs of items linking TO this item
- **Out_Link** (case-insensitive): Comma-separated IDs of items this item links TO

### Example:

| REQ_ID   | Title                | In_Link         | Out_Link        |
|----------|---------------------|-----------------|-----------------|
| SYSR-001 | User Authentication |                 | UC-001,TS-001   |
| SYSR-002 | Data Encryption     |                 | TS-002          |
| UC-001   | Login Process       | SYSR-001        | TS-001,TS-003   |

## API Endpoints

### File Upload
- `POST /api/upload` - Upload Excel files
- `GET /api/files` - List uploaded files
- `DELETE /api/files/{filename}` - Delete a file
- `POST /api/analyze` - Analyze files and create groups

### Group Management
- `GET /api/groups` - Get all groups
- `GET /api/groups/{id}` - Get specific group
- `PUT /api/groups/{id}` - Update group
- `DELETE /api/groups/{id}` - Delete group
- `POST /api/groups/{id}/items` - Add item to group
- `DELETE /api/groups/{id}/items/{item_id}` - Remove item
- `POST /api/groups/merge` - Merge two groups
- `GET /api/groups/statistics/summary` - Get statistics
- `GET /api/groups/{id}/export/json` - Export as JSON
- `GET /api/groups/{id}/export/excel` - Export as Excel

## Development

### Backend Testing

Run the test suite to verify the parser and analyzer:
```bash
cd backend
python test_services.py
```

### Frontend Build

To build the frontend for production:
```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`

### Code Style

- **Backend**: Follow PEP 8 guidelines
- **Frontend**: Use JavaScript (NO TypeScript), follow React best practices

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Change port in main.py:
uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
```

**Module not found:**
```bash
# Ensure virtual environment is activated and dependencies installed
pip install -r requirements.txt
```

### Frontend Issues

**Port 5173 already in use:**
```bash
# Vite will automatically use the next available port
```

**Module not found:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Proxy errors:**
- Ensure backend is running on port 8000
- Check `vite.config.js` proxy configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for educational and commercial use.

## Support

For issues, questions, or contributions, please open an issue on the project repository.

---

**Built with React, FastAPI, and NetworkX**
