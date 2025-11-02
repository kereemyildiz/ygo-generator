"""
Excel Parser Service
Parses Excel files and extracts item data with link relationships.
"""

import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional


class ExcelParser:
    """
    Parser for Excel files containing requirements, use cases, or test scenarios.
    Automatically detects ID columns and link columns, then extracts structured data.
    """

    def __init__(self, filepath: str):
        """
        Initialize parser with an Excel file path.

        Args:
            filepath: Path to the Excel file to parse
        """
        self.filepath = Path(filepath)
        self.df = None
        self.id_column = None
        self.in_link_column = None
        self.out_link_column = None

    def parse(self) -> Dict[str, Any]:
        """
        Parse the Excel file and extract all data with link information.

        Returns:
            Dictionary containing:
                - filename: Name of the source file
                - id_column: Name of the ID column
                - items: List of all items with their data
                - total_items: Count of items

        Raises:
            FileNotFoundError: If the Excel file doesn't exist
            ValueError: If the file format is invalid
        """
        # Read Excel file
        if not self.filepath.exists():
            raise FileNotFoundError(f"Excel file not found: {self.filepath}")

        try:
            self.df = pd.read_excel(self.filepath)
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")

        if self.df.empty:
            raise ValueError("Excel file is empty")

        # Detect columns
        self._detect_columns()

        # Extract items
        items = self._extract_items()

        return {
            'filename': self.filepath.name,
            'id_column': self.id_column,
            'in_link_column': self.in_link_column,
            'out_link_column': self.out_link_column,
            'items': items,
            'total_items': len(items)
        }

    def _detect_columns(self):
        """
        Detect ID column (first column) and link columns (case-insensitive search).
        """
        columns = self.df.columns.tolist()

        # ID column is always the first column
        self.id_column = columns[0]

        # Find In_Link and Out_Link columns (case-insensitive)
        for col in columns:
            col_lower = col.lower()
            if 'in_link' in col_lower or 'inlink' in col_lower:
                self.in_link_column = col
            elif 'out_link' in col_lower or 'outlink' in col_lower:
                self.out_link_column = col

    def _parse_links(self, link_value: Any) -> List[str]:
        """
        Parse comma-separated link values into a list.

        Args:
            link_value: Raw link value (can be string, NaN, None, etc.)

        Returns:
            List of link IDs (empty list if no links)
        """
        # Handle NaN, None, or empty values
        if pd.isna(link_value) or link_value is None or link_value == '':
            return []

        # Convert to string and split by comma
        link_str = str(link_value).strip()
        if not link_str:
            return []

        # Split and clean each link ID
        links = [link.strip() for link in link_str.split(',')]
        # Filter out empty strings
        links = [link for link in links if link]

        return links

    def _extract_items(self) -> List[Dict[str, Any]]:
        """
        Extract all items from the dataframe with their data and links.

        Returns:
            List of item dictionaries
        """
        items = []

        for idx, row in self.df.iterrows():
            # Get the unique ID
            item_id = row[self.id_column]

            # Skip rows with missing IDs
            if pd.isna(item_id) or item_id == '':
                continue

            # Convert row to dictionary (all columns)
            item_data = row.to_dict()

            # Parse In_Link and Out_Link
            in_links = []
            out_links = []

            if self.in_link_column and self.in_link_column in item_data:
                in_links = self._parse_links(item_data[self.in_link_column])

            if self.out_link_column and self.out_link_column in item_data:
                out_links = self._parse_links(item_data[self.out_link_column])

            # Create item structure
            item = {
                'id': str(item_id),
                'source_file': self.filepath.name,
                'data': item_data,
                'in_links': in_links,
                'out_links': out_links
            }

            items.append(item)

        return items


def parse_excel_file(filepath: str) -> Dict[str, Any]:
    """
    Convenience function to parse an Excel file.

    Args:
        filepath: Path to the Excel file

    Returns:
        Parsed data dictionary
    """
    parser = ExcelParser(filepath)
    return parser.parse()


def parse_multiple_files(filepaths: List[str]) -> Dict[str, Any]:
    """
    Parse multiple Excel files and combine the results.

    Args:
        filepaths: List of paths to Excel files

    Returns:
        Dictionary containing:
            - files: List of parsed file data
            - all_items: Combined list of all items from all files
            - total_files: Count of files processed
            - total_items: Total count of items across all files
    """
    all_items = []
    files_data = []

    for filepath in filepaths:
        try:
            parsed = parse_excel_file(filepath)
            files_data.append(parsed)
            all_items.extend(parsed['items'])
        except Exception as e:
            # Log error but continue with other files
            print(f"Error parsing {filepath}: {str(e)}")
            files_data.append({
                'filename': Path(filepath).name,
                'error': str(e),
                'items': []
            })

    return {
        'files': files_data,
        'all_items': all_items,
        'total_files': len(files_data),
        'total_items': len(all_items)
    }
