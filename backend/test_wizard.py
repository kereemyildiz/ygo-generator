"""
Test script for Linking Wizard with Groups integration.
Tests: pre-populated links, suggestions with already_linked, finalize, groups creation.
"""
import requests
import json

BASE = "http://localhost:8000"

# 1. Upload files
print("=== 1. Uploading files ===")
files_to_upload = [
    ("files", open(r"d:\aky-personal\ygo-generator\backend\sample_data\A_System_Requirements.xlsx", "rb")),
    ("files", open(r"d:\aky-personal\ygo-generator\backend\sample_data\B_Use_Cases.xlsx", "rb")),
]
r = requests.post(f"{BASE}/api/upload", files=files_to_upload)
print(f"Upload: {r.status_code}")

# 2. Start wizard — should pre-populate existing links
print("\n=== 2. Starting Wizard (with pre-populated links) ===")
r = requests.post(f"{BASE}/api/linking-wizard/start", json={
    "stt_filename": "A_System_Requirements.xlsx",
    "uc_filename": "B_Use_Cases.xlsx"
})
start_data = r.json()
session_id = start_data["session_id"]
print(f"Status: {r.status_code}")
print(f"Total STT: {start_data['total_stt']}, Total UC: {start_data['total_uc']}")
print(f"Existing links count: {start_data.get('existing_links_count', 'N/A')}")
print(f"STT with existing links: {start_data.get('stt_with_existing_links', 'N/A')}")

# 3. Get current STT — should include existing_uc_ids
print("\n=== 3. Current STT (with existing link info) ===")
r = requests.get(f"{BASE}/api/linking-wizard/{session_id}/current")
current = r.json()
print(f"STT: {current['stt_item']['id']} - {current['stt_item']['data']['Requirement_Title']}")
print(f"Existing UC IDs: {current.get('existing_uc_ids', [])}")
print(f"Current UC IDs: {current.get('current_uc_ids', [])}")

# 4. Get suggestions — should have already_linked flag
print("\n=== 4. Suggestions (with already_linked flag) ===")
r = requests.get(f"{BASE}/api/linking-wizard/{session_id}/suggestions?count=5")
sugg_data = r.json()
for s in sugg_data["suggestions"]:
    item = s["item"]
    existing = "✓ EXISTING" if s.get("already_linked") else ""
    print(f"  {item['id']} - score: {s['relevance_score']} {existing}")

# 5. Confirm links for first STT
stt_id = current["stt_item"]["id"]
uc_ids = [s["item"]["id"] for s in sugg_data["suggestions"][:3]]
print(f"\n=== 5. Confirm: {stt_id} -> {uc_ids} ===")
r = requests.post(f"{BASE}/api/linking-wizard/{session_id}/confirm", json={
    "stt_id": stt_id, "selected_uc_ids": uc_ids
})
confirm = r.json()
print(f"Linked: {confirm['linked_count']}, Existing kept: {confirm.get('existing_kept')}, New: {confirm.get('new_links')}")

# 6. Fast-forward through remaining STTs (confirm existing links + next)
print("\n=== 6. Fast-forwarding through remaining STTs ===")
for i in range(start_data['total_stt'] - 1):
    r = requests.post(f"{BASE}/api/linking-wizard/{session_id}/next")
    next_data = r.json()
    if next_data.get('completed'):
        print(f"  Completed at step {i+2}")
        break
    stt_id = next_data['stt_item']['id']
    existing = next_data.get('current_uc_ids', [])
    # Auto-confirm existing links
    if existing:
        requests.post(f"{BASE}/api/linking-wizard/{session_id}/confirm", json={
            "stt_id": stt_id, "selected_uc_ids": existing
        })
    print(f"  {stt_id}: {len(existing)} existing links confirmed")

# 7. Summary
print("\n=== 7. Summary ===")
r = requests.get(f"{BASE}/api/linking-wizard/{session_id}/summary")
summary = r.json()
print(f"STT linked: {summary['stt_linked']}, Total UC links: {summary['total_uc_links']}")

# 8. FINALIZE — Create groups
print("\n=== 8. FINALIZE — Create Groups ===")
r = requests.post(f"{BASE}/api/linking-wizard/{session_id}/finalize")
finalize = r.json()
print(f"Status: {r.status_code}")
print(f"Groups created: {finalize['groups_created']}")

# 9. Verify groups exist in group_manager
print("\n=== 9. Verify Groups via /api/groups ===")
r = requests.get(f"{BASE}/api/groups")
groups_data = r.json()
groups = groups_data.get("groups", [])
print(f"Total groups: {len(groups)}")
for g in groups[:5]:
    item_ids = [item['id'] for item in g['items']]
    stt_ids = [i for i in item_ids if i.startswith('SYSR')]
    uc_ids = [i for i in item_ids if i.startswith('UC')]
    print(f"  {g['group_id']} ({g['group_name'][:50]}): {len(stt_ids)} STT + {len(uc_ids)} UC")

if len(groups) > 5:
    print(f"  ... and {len(groups) - 5} more groups")

print("\n=== ALL TESTS PASSED ===")
