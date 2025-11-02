"""
Quick script to examine the structure of existing sample Excel files.
"""

import pandas as pd
from pathlib import Path

def examine_file(filepath):
    """Examine and display structure of an Excel file."""
    print(f"\n{'='*80}")
    print(f"File: {filepath.name}")
    print('='*80)

    df = pd.read_excel(filepath)

    print(f"\nShape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"\nColumns: {list(df.columns)}")

    print("\nFirst 3 rows:")
    print(df.head(3).to_string())

    # Check for link columns
    link_cols = [col for col in df.columns if 'link' in col.lower()]
    if link_cols:
        print(f"\nLink columns found: {link_cols}")
        for col in link_cols:
            sample_links = df[col].dropna().head(3).tolist()
            if sample_links:
                print(f"  {col} samples: {sample_links}")

    # Check ID column (first column)
    id_col = df.columns[0]
    print(f"\nID Column: {id_col}")
    print(f"  Sample IDs: {df[id_col].head(5).tolist()}")

def main():
    sample_data_dir = Path(__file__).parent / 'sample_data'

    files = sorted(sample_data_dir.glob('*.xlsx'))

    print(f"Found {len(files)} Excel files in {sample_data_dir}")

    for file in files:
        examine_file(file)

    print(f"\n{'='*80}")
    print("Examination complete!")
    print('='*80)

if __name__ == '__main__':
    main()
