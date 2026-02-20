"""
Linking Wizard Service
Manages STT-based linking wizard sessions with mock RAG suggestions.
Each session walks through STT items one-by-one, suggesting related Use Cases.
"""

import uuid
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from services.excel_parser import parse_excel_file


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

        Args:
            stt_filepath: Path to the System Requirements Excel file
            uc_filepath: Path to the Use Cases Excel file

        Returns:
            Session info with session_id, stt_count, uc_count
        """
        # Parse both files
        stt_data = parse_excel_file(stt_filepath)
        uc_data = parse_excel_file(uc_filepath)

        if not stt_data['items']:
            raise ValueError("STT dokümanında madde bulunamadı")
        if not uc_data['items']:
            raise ValueError("Senaryo dokümanında madde bulunamadı")

        session_id = str(uuid.uuid4())

        session = {
            'session_id': session_id,
            'stt_items': stt_data['items'],
            'uc_items': uc_data['items'],
            'stt_filename': stt_data['filename'],
            'uc_filename': uc_data['filename'],
            'current_index': 0,
            'total_stt': len(stt_data['items']),
            'total_uc': len(uc_data['items']),
            'links': {},  # stt_id -> [uc_ids]
            'skipped': [],  # list of skipped stt_ids
            'created_at': datetime.now().isoformat(),
            'status': 'active'  # active | completed
        }

        self.sessions[session_id] = session

        return {
            'session_id': session_id,
            'stt_filename': stt_data['filename'],
            'uc_filename': uc_data['filename'],
            'total_stt': len(stt_data['items']),
            'total_uc': len(uc_data['items']),
            'status': 'active'
        }

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID."""
        return self.sessions.get(session_id)

    def get_current_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current STT item and progress info.

        Returns:
            Dict with current STT item data + progress info, or None
        """
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
        progress = int((idx / session['total_stt']) * 100)

        return {
            'completed': False,
            'current_index': idx,
            'total_stt': session['total_stt'],
            'progress_percent': progress,
            'stt_item': stt_item
        }

    def get_suggestions(self, session_id: str, count: int = 10) -> Optional[List[Dict[str, Any]]]:
        """
        Get mock RAG suggestions for the current STT item.
        Uses simple keyword matching to simulate RAG behavior.

        Args:
            session_id: The session ID
            count: Number of suggestions to return (default 10)

        Returns:
            List of suggested UC items with relevance scores
        """
        session = self.sessions.get(session_id)
        if not session or session['status'] == 'completed':
            return None

        idx = session['current_index']
        if idx >= len(session['stt_items']):
            return None

        stt_item = session['stt_items'][idx]
        uc_items = session['uc_items']

        # Extract keywords from STT item
        keywords = self._extract_keywords(stt_item)

        # Score each UC item
        scored_ucs = []
        for uc in uc_items:
            score = self._calculate_relevance(keywords, uc)
            scored_ucs.append({
                'item': uc,
                'relevance_score': score
            })

        # Sort by relevance score (descending)
        scored_ucs.sort(key=lambda x: x['relevance_score'], reverse=True)

        # Return top N
        suggestions = scored_ucs[:count]

        return suggestions

    def confirm_links(self, session_id: str, stt_id: str, selected_uc_ids: List[str]) -> Optional[Dict[str, Any]]:
        """
        Confirm links between current STT item and selected UC items.

        Args:
            session_id: The session ID
            stt_id: The STT item ID being linked
            selected_uc_ids: List of selected UC IDs

        Returns:
            Confirmation result
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        # Store links
        session['links'][stt_id] = selected_uc_ids

        return {
            'stt_id': stt_id,
            'linked_uc_ids': selected_uc_ids,
            'linked_count': len(selected_uc_ids)
        }

    def next_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Move to the next STT item.

        Returns:
            Next STT item info or completion status
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        session['current_index'] += 1

        if session['current_index'] >= session['total_stt']:
            session['status'] = 'completed'

        return self.get_current_stt(session_id)

    def skip_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Skip the current STT item and move to next.

        Returns:
            Next STT item info or completion status
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        # Record the skipped item
        idx = session['current_index']
        if idx < len(session['stt_items']):
            session['skipped'].append(session['stt_items'][idx]['id'])

        return self.next_stt(session_id)

    def prev_stt(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Go back to the previous STT item.

        Returns:
            Previous STT item info
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        if session['current_index'] > 0:
            session['current_index'] -= 1
            session['status'] = 'active'

        return self.get_current_stt(session_id)

    def get_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a summary of all links created in this session.

        Returns:
            Summary with all links and statistics
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        # Build detailed link summary
        link_details = []
        uc_map = {uc['id']: uc for uc in session['uc_items']}

        for stt_item in session['stt_items']:
            stt_id = stt_item['id']
            linked_uc_ids = session['links'].get(stt_id, [])
            is_skipped = stt_id in session['skipped']

            linked_ucs = []
            for uc_id in linked_uc_ids:
                if uc_id in uc_map:
                    linked_ucs.append({
                        'id': uc_id,
                        'name': uc_map[uc_id].get('data', {}).get('Use_Case_Name', uc_id)
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

    # ==================== Private helpers ====================

    def _extract_keywords(self, stt_item: Dict[str, Any]) -> List[str]:
        """
        Extract meaningful keywords from an STT item's data fields.
        Used for mock RAG scoring.
        """
        data = stt_item.get('data', {})
        text_fields = []

        # Collect text from relevant fields
        for key in ['Requirement_Title', 'Description', 'Category']:
            val = data.get(key)
            if val and isinstance(val, str):
                text_fields.append(val)

        combined = ' '.join(text_fields).lower()

        # Tokenize and filter
        words = re.findall(r'[a-zA-ZçğıöşüÇĞİÖŞÜ]{3,}', combined)

        # Remove common stopwords
        stopwords = {
            'the', 'and', 'for', 'with', 'shall', 'system', 'that', 'from',
            'this', 'are', 'was', 'not', 'but', 'have', 'has', 'will', 'can',
            'bir', 'ile', 'olan', 'için', 'olan', 'olarak', 'gibi', 'daha',
            'minimum', 'maximum', 'within'
        }
        keywords = [w for w in words if w not in stopwords]

        return list(set(keywords))

    def _calculate_relevance(self, keywords: List[str], uc_item: Dict[str, Any]) -> float:
        """
        Calculate mock relevance score between STT keywords and a UC item.
        """
        data = uc_item.get('data', {})
        text_fields = []

        for key in ['Use_Case_Name', 'Main_Flow', 'Precondition', 'Postcondition', 'Actor']:
            val = data.get(key)
            if val and isinstance(val, str):
                text_fields.append(val)

        uc_text = ' '.join(text_fields).lower()

        if not keywords or not uc_text:
            return 0.0

        # Count keyword matches
        matches = sum(1 for kw in keywords if kw in uc_text)
        score = matches / len(keywords) if keywords else 0

        return round(score, 4)


# Global instance
linking_wizard_manager = LinkingWizardManager()
