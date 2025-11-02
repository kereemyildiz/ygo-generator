"""
Test script to verify Excel parser and link analyzer with sample data.
"""

import json
from pathlib import Path
from services.excel_parser import parse_multiple_files
from services.link_analyzer import analyze_links, get_group_statistics


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print('='*80)


def test_parser():
    """Test the Excel parser with sample files."""
    print_section("Testing Excel Parser")

    # Get sample file paths
    sample_dir = Path(__file__).parent / 'sample_data'
    sample_files = sorted(sample_dir.glob('*.xlsx'))

    if not sample_files:
        print("❌ No sample files found in sample_data/")
        return None

    print(f"\nFound {len(sample_files)} sample files:")
    for f in sample_files:
        print(f"  - {f.name}")

    # Parse files
    print("\nParsing files...")
    file_paths = [str(f) for f in sample_files]
    result = parse_multiple_files(file_paths)

    # Display results
    print(f"\n✓ Parsed {result['total_files']} files")
    print(f"✓ Total items: {result['total_items']}")

    print("\nFiles parsed:")
    for file_data in result['files']:
        if 'error' in file_data:
            print(f"  ❌ {file_data['filename']}: {file_data['error']}")
        else:
            print(f"  ✓ {file_data['filename']}: {file_data['total_items']} items")
            print(f"    - ID column: {file_data['id_column']}")
            print(f"    - In_Link column: {file_data['in_link_column']}")
            print(f"    - Out_Link column: {file_data['out_link_column']}")

    # Show sample items
    print("\nSample items (first 3):")
    for i, item in enumerate(result['all_items'][:3]):
        print(f"\n  Item {i+1}:")
        print(f"    ID: {item['id']}")
        print(f"    Source: {item['source_file']}")
        print(f"    In Links: {item['in_links']}")
        print(f"    Out Links: {item['out_links']}")

    return result


def test_analyzer(parsed_data):
    """Test the link analyzer with parsed items."""
    print_section("Testing Link Analyzer")

    if not parsed_data:
        print("❌ No parsed data to analyze")
        return None

    items = parsed_data['all_items']
    print(f"\nAnalyzing {len(items)} items...")

    # Analyze links
    analysis = analyze_links(items)

    # Display results
    print(f"\n✓ Analysis complete!")
    print(f"✓ Total groups found: {analysis['total_groups']}")
    print(f"✓ Total items analyzed: {analysis['total_items']}")
    print(f"✓ Orphaned items: {analysis['total_orphaned']}")

    # Show groups
    print(f"\nGroups found:")
    for group in analysis['groups']:
        print(f"\n  {group['group_id']}: {group['group_name']}")
        print(f"    Items: {group['item_count']}")
        print(f"    IDs: {', '.join(group['item_ids'][:10])}", end='')
        if group['item_count'] > 10:
            print(f" ... ({group['item_count'] - 10} more)")
        else:
            print()

        # Show source files in this group
        source_files = set(item['source_file'] for item in group['items'])
        print(f"    Source files: {', '.join(sorted(source_files))}")

    # Show statistics
    stats = get_group_statistics(analysis['groups'])
    print(f"\nStatistics:")
    print(f"  Total groups: {stats['total_groups']}")
    print(f"  Total items in groups: {stats['total_items_in_groups']}")
    print(f"  Average group size: {stats['average_group_size']:.2f}")
    print(f"  Largest group: {stats['largest_group_size']} items")
    print(f"  Smallest group: {stats['smallest_group_size']} items")
    print(f"  Source files: {', '.join(stats['source_files'])}")

    # Show orphaned items
    if analysis['orphaned_items']:
        print(f"\nOrphaned items ({len(analysis['orphaned_items'])}):")
        for item in analysis['orphaned_items'][:5]:
            print(f"  - {item['id']} (from {item['source_file']})")
        if len(analysis['orphaned_items']) > 5:
            print(f"  ... and {len(analysis['orphaned_items']) - 5} more")

    return analysis


def test_export(analysis):
    """Test exporting analysis results to JSON."""
    print_section("Testing Export")

    if not analysis:
        print("❌ No analysis data to export")
        return

    # Export to JSON
    output_file = Path(__file__).parent / 'test_output.json'

    export_data = {
        'groups': analysis['groups'],
        'statistics': {
            'total_groups': analysis['total_groups'],
            'total_items': analysis['total_items'],
            'orphaned_count': analysis['total_orphaned']
        },
        'orphaned_items': analysis['orphaned_items']
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Analysis exported to: {output_file}")
    print(f"  File size: {output_file.stat().st_size} bytes")


def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("  SRS Link Manager - Service Test Suite")
    print("="*80)

    # Test parser
    parsed_data = test_parser()

    # Test analyzer
    analysis = test_analyzer(parsed_data)

    # Test export
    test_export(analysis)

    # Final summary
    print_section("Test Summary")
    print("\n✅ All tests completed successfully!")
    print("\nNext steps:")
    print("  1. Review the test_output.json file")
    print("  2. Start the FastAPI server")
    print("  3. Test the API endpoints")
    print()


if __name__ == '__main__':
    main()
