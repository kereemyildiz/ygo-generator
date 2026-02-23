"""
Generate large sample Excel files for performance testing
Creates 1000+ items per file with orphaned items included
"""

import pandas as pd
from pathlib import Path
import random

# Output directory
SAMPLE_DIR = Path(__file__).parent.parent / "sample_data"

# Categories and priorities for variety
CATEGORIES = ['Performance', 'Functional', 'Security', 'Reliability', 'Usability', 'Maintainability']
PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
ACTORS = ['System Operator', 'Administrator', 'Maintenance Personnel', 'External System', 'Automated Process']
TEST_TYPES = ['Functional', 'Performance', 'Security', 'Integration', 'Regression', 'Smoke']
TEST_STATUS = ['Passed', 'Failed', 'Pending', 'Blocked', 'In Progress']


def generate_system_requirements(num_items=1200):
    """Generate System Requirements with ~15% orphaned items"""
    print(f"Generating {num_items} System Requirements...")

    data = []
    orphaned_count = int(num_items * 0.15)  # 15% orphaned

    for i in range(1, num_items + 1):
        req_id = f"SYSR-{i:04d}"

        # Determine if this should be orphaned
        is_orphaned = i <= orphaned_count

        # Generate links if not orphaned
        if is_orphaned:
            in_link = None
            out_link = None
        else:
            # Random in_links (can be empty)
            if random.random() > 0.4 and i > 10:
                num_in = random.randint(0, 2)
                in_links = [f"SYSR-{random.randint(1, i-1):04d}" for _ in range(num_in)]
                in_link = ','.join(in_links) if in_links else None
            else:
                in_link = None

            # Random out_links (link to use cases and tests)
            num_out = random.randint(1, 3)
            out_links = []
            for _ in range(num_out):
                if random.random() > 0.5:
                    out_links.append(f"UC-{random.randint(1, 800):04d}")
                else:
                    out_links.append(f"TS-{random.randint(1, 1000):04d}")
            out_link = ','.join(out_links) if out_links else None

        row = {
            'REQ_ID': req_id,
            'Requirement_Title': f"Requirement {i}: {random.choice(['Detection', 'Processing', 'Analysis', 'Monitoring', 'Control'])} Capability",
            'Category': random.choice(CATEGORIES),
            'Priority': random.choice(PRIORITIES),
            'Description': f"The system shall provide {random.choice(['advanced', 'reliable', 'efficient', 'secure'])} {random.choice(['detection', 'processing', 'analysis', 'monitoring'])} capabilities for operational scenario {i}.",
            'In_Link': in_link,
            'Out_Link': out_link
        }
        data.append(row)

    df = pd.DataFrame(data)
    output_path = SAMPLE_DIR / "A_System_Requirements.xlsx"
    df.to_excel(output_path, index=False)
    print(f"  ✓ Created {output_path} with {len(df)} items ({orphaned_count} orphaned)")
    return df


def generate_use_cases(num_items=800):
    """Generate Use Cases with ~20% orphaned items"""
    print(f"Generating {num_items} Use Cases...")

    data = []
    orphaned_count = int(num_items * 0.20)  # 20% orphaned

    for i in range(1, num_items + 1):
        uc_id = f"UC-{i:04d}"

        # Determine if this should be orphaned
        is_orphaned = i <= orphaned_count

        if is_orphaned:
            in_link = None
            out_link = None
        else:
            # Link back to requirements
            if random.random() > 0.3:
                num_in = random.randint(1, 3)
                in_links = [f"SYSR-{random.randint(1, 1200):04d}" for _ in range(num_in)]
                in_link = ','.join(in_links)
            else:
                in_link = None

            # Link to test scenarios
            if random.random() > 0.3:
                num_out = random.randint(1, 4)
                out_links = [f"TS-{random.randint(1, 1000):04d}" for _ in range(num_out)]
                out_link = ','.join(out_links)
            else:
                out_link = None

        row = {
            'UC_ID': uc_id,
            'Use_Case_Name': f"Use Case {i}: {random.choice(['Detect', 'Track', 'Classify', 'Engage', 'Monitor'])} {random.choice(['Target', 'Threat', 'Object', 'Signal'])}",
            'Actor': random.choice(ACTORS),
            'Precondition': f"System operational, {random.choice(['sensors active', 'network connected', 'database available', 'operators logged in'])}",
            'Main_Flow': f"1. Actor initiates operation\n2. System validates input\n3. System processes request\n4. System returns result",
            'Postcondition': f"Operation completed, {random.choice(['data logged', 'alerts sent', 'report generated', 'status updated'])}",
            'In_Link': in_link,
            'Out_Link': out_link
        }
        data.append(row)

    df = pd.DataFrame(data)
    output_path = SAMPLE_DIR / "B_Use_Cases.xlsx"
    df.to_excel(output_path, index=False)
    print(f"  ✓ Created {output_path} with {len(df)} items ({orphaned_count} orphaned)")
    return df


def generate_test_scenarios(num_items=1500):
    """Generate Test Scenarios with ~10% orphaned items"""
    print(f"Generating {num_items} Test Scenarios...")

    data = []
    orphaned_count = int(num_items * 0.10)  # 10% orphaned

    for i in range(1, num_items + 1):
        ts_id = f"TS-{i:04d}"

        # Determine if this should be orphaned
        is_orphaned = i <= orphaned_count

        if is_orphaned:
            in_link = None
            out_link = None
        else:
            # Link back to requirements and use cases
            in_links = []
            if random.random() > 0.4:
                in_links.append(f"SYSR-{random.randint(1, 1200):04d}")
            if random.random() > 0.5:
                in_links.append(f"UC-{random.randint(1, 800):04d}")
            in_link = ','.join(in_links) if in_links else None

            # Test scenarios typically don't have out_links (they're at the end of chain)
            # But let's add some for testing
            if random.random() > 0.8:
                out_link = f"TS-{random.randint(1, min(i+100, num_items)):04d}"
            else:
                out_link = None

        row = {
            'TS_ID': ts_id,
            'Test_Name': f"Test {i}: Verify {random.choice(['Detection', 'Tracking', 'Classification', 'Response', 'Integration'])} - Scenario {i}",
            'Test_Type': random.choice(TEST_TYPES),
            'Test_Objective': f"Validate system behavior for scenario {i} under {random.choice(['normal', 'stress', 'edge case', 'failure'])} conditions",
            'Test_Steps': f"1. Setup test environment\n2. Execute test case\n3. Verify results\n4. Cleanup",
            'Expected_Result': f"System responds within specifications, {random.choice(['accuracy > 95%', 'latency < 100ms', 'no errors detected', 'all checks passed'])}",
            'Status': random.choice(TEST_STATUS),
            'In_Link': in_link,
            'Out_Link': out_link
        }
        data.append(row)

    df = pd.DataFrame(data)
    output_path = SAMPLE_DIR / "C_Test_Scenarios.xlsx"
    df.to_excel(output_path, index=False)
    print(f"  ✓ Created {output_path} with {len(df)} items ({orphaned_count} orphaned)")
    return df


if __name__ == "__main__":
    print("=" * 80)
    print("Generating Large Sample Files for Performance Testing")
    print("=" * 80)

    # Generate all files
    req_df = generate_system_requirements(1200)
    uc_df = generate_use_cases(800)
    ts_df = generate_test_scenarios(1500)

    print("\n" + "=" * 80)
    print("Summary:")
    print(f"  Total items generated: {len(req_df) + len(uc_df) + len(ts_df)}")
    print(f"  System Requirements: {len(req_df)} items (~180 orphaned)")
    print(f"  Use Cases: {len(uc_df)} items (~160 orphaned)")
    print(f"  Test Scenarios: {len(ts_df)} items (~150 orphaned)")
    print(f"  Estimated total orphaned: ~490 items")
    print("=" * 80)
    print("✓ All files generated successfully!")
