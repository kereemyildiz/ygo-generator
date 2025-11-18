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
        self.model = os.getenv("OPENAI_MODEL", "gpt-4")
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "2000"))
        self.temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))

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
        return """Sen bir savunma sanayi yazılım gereksinim uzmanısın. Görevin, verilen maddelerden detaylı ve profesyonel Yazılım Gereksinim Özellikleri (YGÖ) dokümanı oluşturmak.

YGÖ oluştururken şu kurallara uy:

1. **Netlik ve Kesinlik**: Her gereksinim net, anlaşılır ve ölçülebilir olmalı
2. **İzlenebilirlik**: Maddelerin birbirleriyle olan bağlantılarını göz önünde bulundur
3. **Tutarlılık**: Tüm gereksinimler birbiriyle tutarlı olmalı
4. **Doğrulanabilirlik**: Her gereksinim test edilebilir olmalı
5. **Standartlara Uyum**: Savunma sanayi standartlarına (MIL-STD gibi) uygun format kullan

YGÖ formatı:
- Gereksinim ID'si (REQ-XXX formatında)
- Başlık
- Detaylı açıklama
- Öncelik seviyesi (Kritik/Yüksek/Orta/Düşük)
- İlgili bağlantılar ve izlenebilirlik matrisi
- Doğrulama kriterleri
- Varsa özel kısıtlamalar veya notlar

Teknik terimleri Türkçe kullan, gerektiğinde İngilizce terim parantez içinde verilebilir."""

    def _build_user_prompt(self, items: List[Dict[str, Any]], group_name: str) -> str:
        """
        Build the user prompt with formatted items.

        Args:
            items: List of items to include in prompt
            group_name: Name of the group

        Returns:
            User prompt string
        """
        formatted_items = self._format_items_for_prompt(items)

        return f"""Aşağıdaki maddeleri analiz ederek kapsamlı bir Yazılım Gereksinim Özellikleri (YGÖ) dokümanı oluştur.

GRUP ADI: {group_name}
TOPLAM MADDE SAYISI: {len(items)}

MADDELER:
{formatted_items}

Lütfen bu maddeleri baz alarak:
1. Her madde için detaylı YGÖ gereksinimleri oluştur
2. Maddeler arası ilişkileri ve izlenebilirliği belirt
3. Her gereksinim için doğrulama kriterleri ekle
4. Tutarlı ve profesyonel bir format kullan
5. Gerekirse maddeleri grupla ve kategorize et

YGÖ dokümanını oluştur:"""

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
                max_tokens=self.max_tokens,
                temperature=self.temperature,
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
