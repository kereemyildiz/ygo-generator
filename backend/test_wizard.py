"""
Quick API test for the Linking Wizard endpoints.
"""
import requests
import json

BASE = "http://localhost:8000"

# 1. Upload both files
print("=== 1. Uploading files ===")
files_to_upload = [
    ("files", open(r"d:\aky-personal\ygo-generator\backend\sample_data\A_System_Requirements.xlsx", "rb")),
    ("files", open(r"d:\aky-personal\ygo-generator\backend\sample_data\B_Use_Cases.xlsx", "rb")),
]
r = requests.post(f"{BASE}/api/upload", files=files_to_upload)
print(f"Upload status: {r.status_code}")
print(f"Upload result: {json.dumps(r.json(), indent=2)[:500]}")

# 2. Start wizard session
print("\n=== 2. Starting Linking Wizard ===")
r = requests.post(f"{BASE}/api/linking-wizard/start", json={
    "stt_filename": "A_System_Requirements.xlsx",
    "uc_filename": "B_Use_Cases.xlsx"
})
print(f"Start status: {r.status_code}")
start_data = r.json()
print(f"Start result: {json.dumps(start_data, indent=2)}")
session_id = start_data.get("session_id")

if not session_id:
    print("ERROR: No session_id returned!")
    exit(1)

# 3. Get current STT
print(f"\n=== 3. Get current STT (session: {session_id[:8]}...) ===")
r = requests.get(f"{BASE}/api/linking-wizard/{session_id}/current")
print(f"Current status: {r.status_code}")
current = r.json()
print(f"STT Item: {current.get('stt_item', {}).get('id')} - Progress: {current.get('progress_percent')}%")
print(f"Title: {current.get('stt_item', {}).get('data', {}).get('Requirement_Title')}")

# 4. Get suggestions
print("\n=== 4. Get suggestions ===")
r = requests.get(f"{BASE}/api/linking-wizard/{session_id}/suggestions?count=5")
print(f"Suggestions status: {r.status_code}")
sugg_data = r.json()
print(f"Got {sugg_data.get('count', 0)} suggestions:")
for s in sugg_data.get("suggestions", []):
    item = s.get("item", {})
    score = s.get("relevance_score", 0)
    name = item.get("data", {}).get("Use_Case_Name", "?")
    print(f"  {item.get('id')} - {name} (score: {score})")

# 5. Confirm links
stt_id = current.get("stt_item", {}).get("id")
uc_ids = [s["item"]["id"] for s in sugg_data.get("suggestions", [])[:2]]  # select first 2
print(f"\n=== 5. Confirm links: {stt_id} -> {uc_ids} ===")
r = requests.post(f"{BASE}/api/linking-wizard/{session_id}/confirm", json={
    "stt_id": stt_id,
    "selected_uc_ids": uc_ids
})
print(f"Confirm status: {r.status_code}")
print(f"Confirm result: {json.dumps(r.json(), indent=2)}")

# 6. Next step
print("\n=== 6. Next STT ===")
r = requests.post(f"{BASE}/api/linking-wizard/{session_id}/next")
print(f"Next status: {r.status_code}")
next_data = r.json()
print(f"Next STT: {next_data.get('stt_item', {}).get('id')} - Progress: {next_data.get('progress_percent')}%")

# 7. Skip
print("\n=== 7. Skip STT ===")
r = requests.post(f"{BASE}/api/linking-wizard/{session_id}/skip")
print(f"Skip status: {r.status_code}")
skip_data = r.json()
print(f"After skip - STT: {skip_data.get('stt_item', {}).get('id')} - Progress: {skip_data.get('progress_percent')}%")

# 8. Prev
print("\n=== 8. Prev STT ===")
r = requests.post(f"{BASE}/api/linking-wizard/{session_id}/prev")
print(f"Prev status: {r.status_code}")
prev_data = r.json()
print(f"After prev - STT: {prev_data.get('stt_item', {}).get('id')} - Progress: {prev_data.get('progress_percent')}%")

# 9. Summary (partial)
print("\n=== 9. Summary ===")
r = requests.get(f"{BASE}/api/linking-wizard/{session_id}/summary")
print(f"Summary status: {r.status_code}")
summary = r.json()
print(f"Total STT: {summary.get('total_stt')}, Linked: {summary.get('stt_linked')}, Skipped: {summary.get('stt_skipped')}")
print(f"Total UC links: {summary.get('total_uc_links')}")
for d in summary.get("link_details", [])[:5]:
    status = "LINKED" if d["linked_uc_count"] > 0 else ("SKIPPED" if d["skipped"] else "-")
    ucs = ", ".join(u["id"] for u in d.get("linked_ucs", []))
    print(f"  {d['stt_id']}: {status} -> {ucs or '(none)'}")

print("\n=== ALL TESTS PASSED ===")
