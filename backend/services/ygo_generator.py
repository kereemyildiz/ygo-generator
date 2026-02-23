"""
YGÖ (Yazılım Gereksinim Özellikleri) Generator Service
Generates Software Requirement Specifications using OpenAI API.
"""

import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class YGOGenerator:
    """
    Generates YGÖ (Software Requirement Specifications) from grouped items using OpenAI.
    """

    def __init__(self):
        """Initialize the YGÖ generator with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "your_openai_api_key_here":
            raise ValueError(
                "OPENAI_API_KEY not configured. "
                "Please set OPENAI_API_KEY in your .env file. "
                "See .env.example for reference."
            )

        self.client = AsyncOpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL")
    

    def _format_items_for_prompt(self, items: List[Dict[str, Any]]) -> str:
        """
        Format items into a structured text for the LLM prompt.

        Args:
            items: List of items to format

        Returns:
            Formatted string representation of items
        """
        formatted_lines = []

        for idx, item in enumerate(items, 1):
            formatted_lines.append(f"\n{'='*80}")
            formatted_lines.append(f"MADDE {idx}: {item['id']}")
            formatted_lines.append(f"{'='*80}")

            # Format item data
            data = item.get('data', {})
            for key, value in data.items():
                if value and key.lower() not in ['in_link', 'out_link']:
                    formatted_lines.append(f"  {key}: {value}")

            # Add link information
            if item.get('in_links'):
                formatted_lines.append(f"  Gelen Bağlantılar: {', '.join(item['in_links'])}")
            if item.get('out_links'):
                formatted_lines.append(f"  Giden Bağlantılar: {', '.join(item['out_links'])}")

            formatted_lines.append(f"  Kaynak: {item.get('source_file', 'Bilinmiyor')}")

        return "\n".join(formatted_lines)

    def _build_system_prompt(self) -> str:
        """
        Build the system prompt for YGÖ generation.

        Returns:
            System prompt string
        """
        from services.system_prompt import SYSTEM_PROMPT
        return SYSTEM_PROMPT

    def _build_user_prompt(self, items: List[Dict[str, Any]], group_name: str) -> str:
        """
        Build the user prompt with formatted items.

        Args:
            items: List of items to include in prompt
            group_name: Name of the group

        Returns:
            User prompt string
        """
        from services.system_prompt import USER_PROMPT_TEMPLATE
        formatted_items = self._format_items_for_prompt(items)

        return USER_PROMPT_TEMPLATE.format(
            group_name=group_name,
            item_count=len(items),
            formatted_items=formatted_items
        )

    async def generate_ygo(
        self,
        items: List[Dict[str, Any]],
        group_name: str,
        stream: bool = False
    ) -> str:
        """
        Generate YGÖ text from items using OpenAI.

        Args:
            items: List of items to generate YGÖ from
            group_name: Name of the group
            stream: Whether to stream the response (for future use)

        Returns:
            Generated YGÖ text

        Raises:
            Exception: If OpenAI API call fails
        """
        if not items:
            raise ValueError("No items provided for YGÖ generation")

        try:
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(items, group_name)

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                stream=False
            )

            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    async def generate_ygo_batch(
        self,
        groups: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate YGÖ for multiple groups (batch processing).

        Args:
            groups: List of groups, each with 'group_id', 'group_name', and 'items'

        Returns:
            List of results with group_id and generated YGÖ text
        """
        results = []

        for group in groups:
            try:
                ygo_text = await self.generate_ygo(
                    items=group['items'],
                    group_name=group['group_name']
                )

                results.append({
                    "group_id": group['group_id'],
                    "group_name": group['group_name'],
                    "ygo_text": ygo_text,
                    "items_processed": len(group['items']),
                    "status": "success"
                })

            except Exception as e:
                results.append({
                    "group_id": group['group_id'],
                    "group_name": group['group_name'],
                    "error": str(e),
                    "status": "failed"
                })

        return results


# Global instance
ygo_generator = YGOGenerator() if os.getenv("OPENAI_API_KEY") else None
