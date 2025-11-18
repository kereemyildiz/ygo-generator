# YGÖ (Yazılım Gereksinim Özellikleri) Feature Setup

## Overview
This application now includes AI-powered YGÖ (Software Requirement Specifications) generation using OpenAI's GPT models. This feature allows you to automatically generate detailed requirement specifications from your grouped items.

## Features

### 1. Single Group YGÖ Generation
- Generate YGÖ for a specific group
- Option to generate for selected items only or all items in the group
- Real-time progress tracking
- View, copy, or download the generated YGÖ

### 2. Batch YGÖ Generation
- Select multiple groups for batch processing
- Generate YGÖ for all selected groups in one operation
- Individual progress tracking for each group
- Consolidated results view with success/failure status

### 3. Non-Blocking Operations
- YGÖ generation runs in the background
- Progress indicators show real-time status
- Users can continue working while generation is in progress

## Setup Instructions

### 1. Install OpenAI Python SDK

```bash
cd backend
pip install -r requirements.txt
```

This will install `openai>=1.0.0` along with other dependencies.

### 2. Configure OpenAI API Key

#### Option A: Using .env file (Recommended)

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit the `.env` file and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

3. Get your API key from: https://platform.openai.com/api-keys

#### Option B: Using Environment Variables

Set the environment variable before starting the backend:

**Linux/Mac:**
```bash
export OPENAI_API_KEY="sk-your-actual-api-key-here"
python main.py
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="sk-your-actual-api-key-here"
python main.py
```

**Windows (CMD):**
```cmd
set OPENAI_API_KEY=sk-your-actual-api-key-here
python main.py
```

### 3. Start the Backend

```bash
cd backend
python main.py
```

The backend will start on `http://localhost:8000`. Check the startup logs to confirm the YGÖ service is configured:
```
==========================================
  SRS Link Manager API - Starting
==========================================
  Docs: http://localhost:8000/api/docs
  Health: http://localhost:8000/health
  In-memory storage cleared - starting with clean state
==========================================
```

### 4. Verify YGÖ Service Health

You can check if the YGÖ service is properly configured by visiting:
```
http://localhost:8000/api/ygo/health
```

Response should be:
```json
{
  "status": "healthy",
  "openai_configured": true,
  "message": "YGÖ service is ready"
}
```

If `openai_configured` is `false`, check your API key configuration.

## Usage

### Using the Web Interface

#### Single Group YGÖ Generation:

1. Upload Excel files with requirements
2. Click "Bağlantıları Analiz Et" to create groups
3. Expand a group to see its items
4. (Optional) Select specific items using checkboxes
5. Click the **"YGÖ Maddesi Üret"** button (purple gradient button)
6. Wait for the progress indicator
7. View the generated YGÖ in the result modal
8. Copy to clipboard or download as a text file

#### Batch YGÖ Generation:

1. Select multiple groups using the checkboxes on the left of each group
2. Click the **"Toplu YGÖ Üret"** button that appears at the top
3. Wait for all groups to be processed
4. View the batch results showing success/failure for each group
5. Expand individual results to view generated YGÖ

### Using the API

#### Generate YGÖ for a Single Group:

```bash
curl -X POST "http://localhost:8000/api/ygo/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "GROUP-001",
    "item_ids": ["SYSR-001", "UC-001"]
  }'
```

Response:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "started",
  "message": "YGÖ üretimi başlatıldı: 2 madde işlenecek"
}
```

#### Check Job Status:

```bash
curl "http://localhost:8000/api/ygo/jobs/550e8400-e29b-41d4-a716-446655440000"
```

Response:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_type": "ygo_single",
  "description": "YGÖ üretimi: Linklenen Maddeler 1 (2 madde)",
  "status": "completed",
  "progress": 100,
  "total_items": 2,
  "processed_items": 2,
  "result": {
    "group_id": "GROUP-001",
    "group_name": "Linklenen Maddeler 1",
    "ygo_text": "... generated text ...",
    "items_processed": 2,
    "total_items": 5
  },
  "error": null,
  "created_at": "2025-11-18T10:30:00.000000",
  "started_at": "2025-11-18T10:30:01.000000",
  "completed_at": "2025-11-18T10:30:15.000000"
}
```

#### Batch Generate YGÖ:

```bash
curl -X POST "http://localhost:8000/api/ygo/generate-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "group_ids": ["GROUP-001", "GROUP-002", "GROUP-003"]
  }'
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key (required) | - |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4` |
| `OPENAI_MAX_TOKENS` | Maximum tokens in response | `2000` |
| `OPENAI_TEMPERATURE` | Temperature for generation (0-1) | `0.7` |

### Recommended Settings

- **For detailed, comprehensive YGÖ:** Use `gpt-4` with `max_tokens=4000`
- **For faster, cost-effective YGÖ:** Use `gpt-3.5-turbo` with `max_tokens=2000`
- **For more creative output:** Increase `temperature` to `0.8-1.0`
- **For more focused output:** Decrease `temperature` to `0.3-0.5`

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"

**Solution:** Make sure you've set the `OPENAI_API_KEY` environment variable or created a `.env` file with the key.

### Error: "Incorrect API key provided"

**Solution:** Verify your API key is correct. Get a new one from https://platform.openai.com/api-keys

### Error: "You exceeded your current quota"

**Solution:** Check your OpenAI account billing and add credits: https://platform.openai.com/account/billing

### YGÖ Generation is Slow

**Factors affecting speed:**
- Number of items in the group (more items = longer processing)
- OpenAI API response time (typically 5-30 seconds)
- Your model choice (GPT-4 is slower but more detailed than GPT-3.5-turbo)

**Tips:**
- Use batch processing for multiple groups to process them in parallel
- Consider using `gpt-3.5-turbo` for faster results
- Reduce `max_tokens` if you don't need very long outputs

## API Costs

OpenAI charges based on tokens used. Approximate costs:

- **GPT-4:** $0.03 per 1K input tokens, $0.06 per 1K output tokens
- **GPT-3.5-turbo:** $0.001 per 1K input tokens, $0.002 per 1K output tokens

**Example:** Generating YGÖ for a group with 10 items typically uses:
- ~1000 input tokens (item data + prompt)
- ~2000 output tokens (generated YGÖ)
- **Total cost with GPT-4:** ~$0.15 per generation
- **Total cost with GPT-3.5-turbo:** ~$0.005 per generation

## Security Best Practices

1. **Never commit `.env` file to git** - It's already in `.gitignore`
2. **Use environment-specific API keys** - Different keys for dev/staging/production
3. **Rotate API keys regularly** - Generate new keys periodically
4. **Monitor API usage** - Check your OpenAI dashboard for unexpected usage
5. **Set usage limits** - Configure spending limits in your OpenAI account

## Support

For issues or questions:
- Check the API documentation: http://localhost:8000/api/docs
- Review OpenAI documentation: https://platform.openai.com/docs
- Contact the development team

## Future Enhancements

Planned features:
- [ ] Custom system prompts per group
- [ ] Template-based YGÖ generation
- [ ] Export YGÖ in multiple formats (PDF, DOCX, HTML)
- [ ] Streaming responses for real-time generation
- [ ] Fine-tuned models for domain-specific requirements
- [ ] Integration with version control for YGÖ history
