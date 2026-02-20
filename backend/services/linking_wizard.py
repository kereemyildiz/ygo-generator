"""
Linking Wizard Service
Manages STT-based linking wizard sessions with mock RAG suggestions.
Each session walks through STT items one-by-one, suggesting related Use Cases.
Supports pre-populating existing Excel links and creating groups from results.
"""

import uuid
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from services.excel_parser import parse_excel_file
from services.group_manager import group_manager


class LinkingWizardManager:
    """
    Manages linking wizard sessions.
    Each session holds parsed STT + UC data and tracks linking progress.
    """

    def __init__(self):
        """Initialize with empty session storage."""
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def start_session(self, stt_filepath: str, uc_filepath: str) -> Dict[str, Any]:
        """
        Start a new linking wizard session.
        Parses both files and pre-populates existing links from Excel data.
        """
        # Parse both files
        stt_data = parse_excel_file(stt_filepath)
        uc_data = parse_excel_file(uc_filepath)

        if not stt_data['items']:
            raise ValueError("STT dokümanında madde bulunamadı")
        if not uc_data['items']:
            raise ValueError("Senaryo dokümanında madde bulunamadı")

        session_id = str(uuid.uuid4())

        # Build UC ID set for validation
        uc_id_set = {uc['id'] for uc in uc_data['items']}

        # Pre-populate existing links from Excel In_Link/Out_Link columns
        existing_links = {}  # stt_id -> [uc_ids that exist in UC file]
        for stt_item in stt_data['items']:
            stt_id = stt_item['id']
            linked_uc_ids = []

            # Check out_links for UC references
            for link_id in stt_item.get('out_links', []):
                if link_id in uc_id_set:
                    linked_uc_ids.append(link_id)

            # Also check in_links (in case UC links back to STT)
            # But we primarily care about STT -> UC direction via out_links

            if linked_uc_ids:
                existing_links[stt_id] = linked_uc_ids

        # Also check UC -> STT direction (UC's in_links pointing to STT IDs)
        stt_id_set = {stt['id'] for stt in stt_data['items']}
        for uc_item in uc_data['items']:
            uc_id = uc_item['id']
            for link_id in uc_item.get('in_links', []):
                if link_id in stt_id_set:
                    # This UC links back to this STT
                    if link_id not in existing_links:
                        existing_links[link_id] = []
                    if uc_id not in existing_links[link_id]:
                        existing_links[link_id].append(uc_id)

        session = {
            'session_id': session_id,
            'stt_items': stt_data['items'],
            'uc_items': uc_data['items'],
            'stt_filename': stt_data['filename'],
            'uc_filename': uc_data['filename'],
            'current_index': 0,
            'total_stt': len(stt_data['items']),
            'total_uc': len(uc_data['items']),
            'links': dict(existing_links),  # Start with existing links pre-populated
            'existing_links': existing_links,  # Keep original Excel links separate
            'skipped': [],
            'created_at': datetime.now().isoformat(),
            'status': 'active'
        }

        self.sessions[session_id] = session

        total_existing = sum(len(v) for v in existing_links.values())

        return {
            'session_id': session_id,
            'stt_filename': stt_data['filename'],
            'uc_filename': uc_data['filename'],
            'total_stt': len(stt_data['items']),
            'total_uc': len(uc_data['items']),
            'existing_links_count': total_existing,
            'stt_with_existing_links': len(existing_links),
            'status': 'active'
        }

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID."""
        return self.sessions.get(session_id)

    def get_current_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the current STT item and progress info."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        if session['status'] == 'completed':
            return {
                'completed': True,
                'current_index': session['current_index'],
                'total_stt': session['total_stt'],
                'progress_percent': 100
            }

        idx = session['current_index']
        if idx >= len(session['stt_items']):
            session['status'] = 'completed'
            return {
                'completed': True,
                'current_index': idx,
                'total_stt': session['total_stt'],
                'progress_percent': 100
            }

        stt_item = session['stt_items'][idx]
        stt_id = stt_item['id']
        progress = int((idx / session['total_stt']) * 100)

        # Include existing link info for this STT
        existing = session['existing_links'].get(stt_id, [])
        current_links = session['links'].get(stt_id, [])

        return {
            'completed': False,
            'current_index': idx,
            'total_stt': session['total_stt'],
            'progress_percent': progress,
            'stt_item': stt_item,
            'existing_uc_ids': existing,
            'current_uc_ids': current_links
        }

    def get_suggestions(self, session_id: str, count: int = 10) -> Optional[List[Dict[str, Any]]]:
        """
        Get suggestions for the current STT item.
        Existing Excel links come first (marked as already_linked),
        followed by mock RAG suggestions.
        """
        session = self.sessions.get(session_id)
        if not session or session['status'] == 'completed':
            return None

        idx = session['current_index']
        if idx >= len(session['stt_items']):
            return None

        stt_item = session['stt_items'][idx]
        stt_id = stt_item['id']
        uc_items = session['uc_items']

        # Get existing links for this STT
        existing_uc_ids = set(session['existing_links'].get(stt_id, []))

        # Extract keywords for mock RAG
        keywords = self._extract_keywords(stt_item)

        # Score each UC item
        scored_ucs = []
        for uc in uc_items:
            is_existing = uc['id'] in existing_uc_ids
            rag_score = self._calculate_relevance(keywords, uc)

            # Existing links get a large bonus so they sort to top
            final_score = rag_score + (2.0 if is_existing else 0.0)

            scored_ucs.append({
                'item': uc,
                'relevance_score': round(rag_score, 4),
                'already_linked': is_existing,
                'sort_score': final_score
            })

        # Sort by sort_score (existing links first, then by relevance)
        scored_ucs.sort(key=lambda x: x['sort_score'], reverse=True)

        # Remove internal sort_score from response
        for s in scored_ucs:
            del s['sort_score']

        # Return top N (but always include all existing links)
        existing_count = len(existing_uc_ids)
        result_count = max(count, existing_count)
        suggestions = scored_ucs[:result_count]

        return suggestions

    def confirm_links(self, session_id: str, stt_id: str, selected_uc_ids: List[str]) -> Optional[Dict[str, Any]]:
        """Confirm links between current STT item and selected UC items."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        session['links'][stt_id] = selected_uc_ids

        existing = session['existing_links'].get(stt_id, [])
        new_links = [uid for uid in selected_uc_ids if uid not in existing]
        kept_existing = [uid for uid in selected_uc_ids if uid in existing]

        return {
            'stt_id': stt_id,
            'linked_uc_ids': selected_uc_ids,
            'linked_count': len(selected_uc_ids),
            'existing_kept': len(kept_existing),
            'new_links': len(new_links)
        }

    def next_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Move to the next STT item."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        session['current_index'] += 1
        if session['current_index'] >= session['total_stt']:
            session['status'] = 'completed'

        return self.get_current_stt(session_id)

    def skip_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Skip the current STT item and move to next."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        idx = session['current_index']
        if idx < len(session['stt_items']):
            session['skipped'].append(session['stt_items'][idx]['id'])

        return self.next_stt(session_id)

    def prev_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Go back to the previous STT item."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        if session['current_index'] > 0:
            session['current_index'] -= 1
            session['status'] = 'active'

        return self.get_current_stt(session_id)

    def get_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a summary of all links created in this session."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        link_details = []
        uc_map = {uc['id']: uc for uc in session['uc_items']}

        for stt_item in session['stt_items']:
            stt_id = stt_item['id']
            linked_uc_ids = session['links'].get(stt_id, [])
            existing_uc_ids = set(session['existing_links'].get(stt_id, []))
            is_skipped = stt_id in session['skipped']

            linked_ucs = []
            for uc_id in linked_uc_ids:
                if uc_id in uc_map:
                    linked_ucs.append({
                        'id': uc_id,
                        'name': uc_map[uc_id].get('data', {}).get('Use_Case_Name', uc_id),
                        'is_existing': uc_id in existing_uc_ids
                    })

            link_details.append({
                'stt_id': stt_id,
                'stt_title': stt_item.get('data', {}).get('Requirement_Title', stt_id),
                'linked_uc_count': len(linked_uc_ids),
                'linked_ucs': linked_ucs,
                'skipped': is_skipped
            })

        total_linked = sum(1 for d in link_details if d['linked_uc_count'] > 0)
        total_skipped = len(session['skipped'])
        total_uc_links = sum(d['linked_uc_count'] for d in link_details)

        return {
            'session_id': session_id,
            'status': session['status'],
            'stt_filename': session['stt_filename'],
            'uc_filename': session['uc_filename'],
            'total_stt': session['total_stt'],
            'total_uc': session['total_uc'],
            'stt_linked': total_linked,
            'stt_skipped': total_skipped,
            'stt_unprocessed': session['total_stt'] - total_linked - total_skipped,
            'total_uc_links': total_uc_links,
            'link_details': link_details
        }

    def finalize_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Finalize the wizard session: create groups in group_manager.
        Each STT item becomes a group containing the STT + linked UC items.
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        uc_map = {uc['id']: uc for uc in session['uc_items']}

        # Clear existing groups first
        group_manager.clear_all_groups()

        created_groups = []
        for stt_item in session['stt_items']:
            stt_id = stt_item['id']
            linked_uc_ids = session['links'].get(stt_id, [])
            stt_title = stt_item.get('data', {}).get('Requirement_Title', stt_id)

            # Build items list: STT item first, then linked UCs
            group_items = [stt_item]
            for uc_id in linked_uc_ids:
                if uc_id in uc_map:
                    group_items.append(uc_map[uc_id])

            group_name = f"{stt_id}: {stt_title}"

            group = group_manager.create_group({
                'group_name': group_name,
                'items': group_items
            })
            created_groups.append(group['group_id'])

        session['status'] = 'finalized'

        return {
            'session_id': session_id,
            'groups_created': len(created_groups),
            'group_ids': created_groups
        }

    # ==================== Private helpers ====================

    def _extract_keywords(self, stt_item: Dict[str, Any]) -> List[str]:
        """Extract meaningful keywords from an STT item's data fields."""
        data = stt_item.get('data', {})
        text_fields = []

        for key in ['Requirement_Title', 'Description', 'Category']:
            val = data.get(key)
            if val and isinstance(val, str):
                text_fields.append(val)

        combined = ' '.join(text_fields).lower()
        words = re.findall(r'[a-zA-ZçğıöşüÇĞİÖŞÜ]{3,}', combined)

        stopwords = {
            'the', 'and', 'for', 'with', 'shall', 'system', 'that', 'from',
            'this', 'are', 'was', 'not', 'but', 'have', 'has', 'will', 'can',
            'bir', 'ile', 'olan', 'için', 'olan', 'olarak', 'gibi', 'daha',
            'minimum', 'maximum', 'within'
        }
        keywords = [w for w in words if w not in stopwords]
        return list(set(keywords))

    def _calculate_relevance(self, keywords: List[str], uc_item: Dict[str, Any]) -> float:
        """Calculate mock relevance score between STT keywords and a UC item."""
        data = uc_item.get('data', {})
        text_fields = []

        for key in ['Use_Case_Name', 'Main_Flow', 'Precondition', 'Postcondition', 'Actor']:
            val = data.get(key)
            if val and isinstance(val, str):
                text_fields.append(val)

        uc_text = ' '.join(text_fields).lower()

        if not keywords or not uc_text:
            return 0.0

        matches = sum(1 for kw in keywords if kw in uc_text)
        score = matches / len(keywords) if keywords else 0
        return round(score, 4)


# Global instance
linking_wizard_manager = LinkingWizardManager()
