"""
Script to generate sample Excel data files for testing the SRS Link Manager.
This creates three interconnected requirements documents with various linking patterns.
"""

import pandas as pd
from pathlib import Path

def create_system_requirements():
    """Create A_System_Requirements.xlsx with system requirements data."""
    data = {
        'REQ_ID': [
            'SYSR-001', 'SYSR-002', 'SYSR-003', 'SYSR-004', 'SYSR-005',
            'SYSR-006', 'SYSR-007', 'SYSR-008', 'SYSR-009', 'SYSR-010'
        ],
        'Requirement_Title': [
            'User Authentication',
            'Data Encryption',
            'Access Control',
            'Audit Logging',
            'Password Policy',
            'Session Management',
            'Data Backup',
            'System Performance',
            'Error Handling',
            'User Interface Responsiveness'
        ],
        'Category': [
            'Security', 'Security', 'Security', 'Compliance', 'Security',
            'Security', 'Reliability', 'Performance', 'Reliability', 'Usability'
        ],
        'Priority': [
            'High', 'High', 'High', 'Medium', 'High',
            'Medium', 'High', 'Medium', 'Medium', 'Low'
        ],
        'Description': [
            'System shall authenticate users using multi-factor authentication',
            'All sensitive data shall be encrypted at rest and in transit',
            'System shall implement role-based access control',
            'All user actions shall be logged for audit purposes',
            'Passwords must meet complexity requirements',
            'User sessions shall timeout after 30 minutes of inactivity',
            'System shall perform automated daily backups',
            'System shall respond to user requests within 2 seconds',
            'System shall handle and log all errors gracefully',
            'UI shall be responsive and work on mobile devices'
        ],
        'In_Link': [
            '', '', 'SYSR-001', 'SYSR-001', 'SYSR-001',
            'SYSR-001', '', '', '', ''
        ],
        'Out_Link': [
            'UC-001,UC-002', 'TS-001,TS-002', 'UC-003', 'TS-003', 'TS-004',
            'UC-002,TS-005', 'TS-006', 'TS-007,TS-008', 'TS-009', 'TS-010'
        ]
    }

    df = pd.DataFrame(data)
    return df

def create_use_cases():
    """Create B_Use_Cases.xlsx with use case data."""
    data = {
        'UC_ID': [
            'UC-001', 'UC-002', 'UC-003', 'UC-004', 'UC-005',
            'UC-006', 'UC-007', 'UC-008'
        ],
        'Use_Case_Name': [
            'User Login',
            'User Logout',
            'View Protected Data',
            'Upload Document',
            'Download Report',
            'Change Password',
            'Reset Password',
            'Manage User Roles'
        ],
        'Actor': [
            'User', 'User', 'Authorized User', 'User', 'User',
            'User', 'User', 'Administrator'
        ],
        'Precondition': [
            'User has valid credentials',
            'User is logged in',
            'User is authenticated and authorized',
            'User is logged in',
            'User is logged in',
            'User is logged in',
            'User has forgotten password',
            'Administrator is logged in'
        ],
        'Main_Flow': [
            '1. User enters credentials 2. System validates 3. User is authenticated',
            '1. User clicks logout 2. System invalidates session 3. User redirected to login',
            '1. User requests data 2. System checks authorization 3. Data displayed',
            '1. User selects file 2. System validates file 3. File uploaded',
            '1. User requests report 2. System generates report 3. File downloaded',
            '1. User enters old and new password 2. System validates 3. Password updated',
            '1. User requests reset 2. Email sent 3. User creates new password',
            '1. Admin selects user 2. Admin assigns roles 3. Permissions updated'
        ],
        'Postcondition': [
            'User is authenticated and has active session',
            'User session is terminated',
            'User has viewed the requested data',
            'Document is stored in system',
            'Report file is on user device',
            'New password is active',
            'User can login with new password',
            'User has updated permissions'
        ],
        'In_Link': [
            'SYSR-001', 'SYSR-001,SYSR-006', 'SYSR-003', '', '',
            'SYSR-005', '', 'SYSR-003'
        ],
        'Out_Link': [
            'TS-001,TS-011', 'TS-005,TS-012', 'TS-013', 'TS-014', 'TS-015',
            'TS-004,TS-016', 'TS-017', 'TS-018'
        ]
    }

    df = pd.DataFrame(data)
    return df

def create_test_scenarios():
    """Create C_Test_Scenarios.xlsx with test scenario data."""
    data = {
        'TS_ID': [
            'TS-001', 'TS-002', 'TS-003', 'TS-004', 'TS-005',
            'TS-006', 'TS-007', 'TS-008', 'TS-009', 'TS-010',
            'TS-011', 'TS-012', 'TS-013', 'TS-014', 'TS-015',
            'TS-016', 'TS-017', 'TS-018'
        ],
        'Scenario_Name': [
            'Verify Data Encryption',
            'Test Encryption Algorithms',
            'Audit Log Verification',
            'Password Complexity Check',
            'Session Timeout Test',
            'Backup Restoration Test',
            'Performance Load Test',
            'Performance Stress Test',
            'Error Recovery Test',
            'UI Responsiveness Test',
            'Login Success Test',
            'Logout Success Test',
            'Access Control Test',
            'File Upload Test',
            'Report Download Test',
            'Password Change Test',
            'Password Reset Test',
            'Role Management Test'
        ],
        'Test_Type': [
            'Security', 'Security', 'Compliance', 'Security', 'Security',
            'Reliability', 'Performance', 'Performance', 'Reliability', 'Usability',
            'Functional', 'Functional', 'Security', 'Functional', 'Functional',
            'Security', 'Functional', 'Security'
        ],
        'Test_Objective': [
            'Verify all data is encrypted properly',
            'Test encryption algorithm strength',
            'Confirm all actions are logged',
            'Test password meets requirements',
            'Verify session expires correctly',
            'Test backup can be restored',
            'Measure response time under load',
            'Test system under maximum load',
            'Verify error handling works',
            'Test UI on various devices',
            'Verify successful user login',
            'Verify session termination',
            'Verify role-based access works',
            'Test file upload functionality',
            'Test report generation',
            'Verify password can be changed',
            'Verify password reset flow',
            'Verify role assignment works'
        ],
        'Success_Criteria': [
            'All data encrypted with AES-256',
            'Encryption passes security audit',
            'All actions appear in audit log',
            'Password meets complexity rules',
            'Session expires after 30 minutes',
            'Backup restores successfully',
            'Response time < 2 seconds',
            'System remains stable under load',
            'Errors logged and handled gracefully',
            'UI works on mobile and desktop',
            'User authenticated and redirected',
            'Session cleared, user logged out',
            'Unauthorized access denied',
            'File uploaded and stored',
            'Report downloaded correctly',
            'New password accepted',
            'Reset email sent and password updated',
            'Roles assigned and permissions active'
        ],
        'Test_Method': [
            'Automated security scan',
            'Penetration testing',
            'Manual log inspection',
            'Automated validation',
            'Automated timer test',
            'Automated restore procedure',
            'Load testing tool',
            'Stress testing tool',
            'Automated error injection',
            'Cross-browser testing',
            'Automated functional test',
            'Automated functional test',
            'Automated security test',
            'Automated functional test',
            'Automated functional test',
            'Automated functional test',
            'Automated functional test',
            'Automated functional test'
        ],
        'In_Link': [
            'SYSR-002', 'SYSR-002', 'SYSR-004', 'SYSR-005', 'SYSR-006',
            'SYSR-007', 'SYSR-008', 'SYSR-008', 'SYSR-009', 'SYSR-010',
            'SYSR-001,UC-001', 'SYSR-006,UC-002', 'SYSR-003,UC-003', 'UC-004', 'UC-005',
            'SYSR-005,UC-006', 'UC-007', 'SYSR-003,UC-008'
        ],
        'Out_Link': [
            '', '', '', '', '',
            '', '', '', '', '',
            '', '', '', '', '',
            '', '', ''
        ]
    }

    df = pd.DataFrame(data)
    return df

def main():
    """Generate all sample Excel files."""
    # Create sample_data directory if it doesn't exist
    sample_data_dir = Path(__file__).parent.parent / 'sample_data'
    sample_data_dir.mkdir(exist_ok=True)

    # Generate and save System Requirements
    print("Generating A_System_Requirements.xlsx...")
    df_sysr = create_system_requirements()
    df_sysr.to_excel(sample_data_dir / 'A_System_Requirements.xlsx', index=False)
    print(f"  Created with {len(df_sysr)} requirements")

    # Generate and save Use Cases
    print("Generating B_Use_Cases.xlsx...")
    df_uc = create_use_cases()
    df_uc.to_excel(sample_data_dir / 'B_Use_Cases.xlsx', index=False)
    print(f"  Created with {len(df_uc)} use cases")

    # Generate and save Test Scenarios
    print("Generating C_Test_Scenarios.xlsx...")
    df_ts = create_test_scenarios()
    df_ts.to_excel(sample_data_dir / 'C_Test_Scenarios.xlsx', index=False)
    print(f"  Created with {len(df_ts)} test scenarios")

    print("\n✓ All sample data files created successfully!")
    print(f"  Location: {sample_data_dir.absolute()}")

if __name__ == '__main__':
    main()
