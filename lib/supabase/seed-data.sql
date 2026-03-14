-- ============================================================
-- PulseOps Seed Data
-- ============================================================
-- 
-- HOW TO USE:
-- 1. Log in to your Supabase Dashboard → SQL Editor
-- 2. First, find your user ID by running:
--      SELECT id, email FROM auth.users;
-- 3. Copy your UUID and replace the placeholder below:
-- 4. Run this entire script
--
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual UUID
-- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- ============================================================

DO $$
DECLARE
  my_uid UUID := 'f624d3ff-04f5-498c-b6b4-9b2eebf6b9b6';  -- ← REPLACE THIS
  my_org UUID;
BEGIN

-- ────────────────────────────────────────────────
-- Ensure profile exists
-- ────────────────────────────────────────────────
INSERT INTO profiles (id, full_name, email, role, organization_id)
SELECT my_uid, 'Admin User', (SELECT email FROM auth.users WHERE id = my_uid), 'admin',
       COALESCE((SELECT organization_id FROM profiles WHERE id = my_uid), gen_random_uuid())
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = my_uid);

-- Get the organization_id for use in all inserts
SELECT organization_id INTO my_org FROM profiles WHERE id = my_uid;

-- ────────────────────────────────────────────────
-- Tickets (25 realistic IT helpdesk tickets)
-- ────────────────────────────────────────────────
INSERT INTO tickets (title, description, status, priority, created_by, assigned_to, organization_id, created_at) VALUES
('VPN not connecting after Windows update',
 'After the latest Windows update KB5034441, VPN client fails to establish connection. Error: "Connection timed out". Tried reinstalling the VPN client but same issue persists.',
 'open', 'high', my_uid, my_uid, my_org, NOW() - INTERVAL '10 minutes'),

('Outlook keeps crashing on startup',
 'Outlook crashes immediately after splash screen. Safe mode works fine. Suspect a corrupt add-in. User needs email access urgently for client meeting.',
 'open', 'critical', my_uid, my_uid, my_org, NOW() - INTERVAL '35 minutes'),

('New laptop setup for Marketing team',
 'Sarah from Marketing starting Monday. Need standard laptop setup: Office 365, Slack, Adobe Creative Suite, VPN client, and mapped network drives.',
 'in_progress', 'medium', my_uid, my_uid, my_org, NOW() - INTERVAL '2 hours'),

('Printer offline in Conference Room B',
 'HP LaserJet in room 204 shows offline. Other users on the same floor can print to it. Might be a driver issue on this specific workstation.',
 'in_progress', 'low', my_uid, my_uid, my_org, NOW() - INTERVAL '3 hours'),

('Password reset request - John Smith',
 'User locked out after 5 failed attempts. Account in Active Directory shows locked. Need to unlock and reset password per security policy.',
 'closed', 'low', my_uid, my_uid, my_org, NOW() - INTERVAL '4 hours'),

('SharePoint permissions issue for Finance folder',
 'Finance team cannot access the Q4 Reports folder on SharePoint. Getting "Access Denied". They had access last week - might be related to the recent group policy change.',
 'open', 'high', my_uid, my_uid, my_org, NOW() - INTERVAL '1 day'),

('Monitor flickering on workstation WS-0247',
 'Left monitor flickers intermittently. Tried different cable (HDMI and DP). Happens with both cables. Suspect hardware failure.',
 'pending', 'medium', my_uid, NULL, my_org, NOW() - INTERVAL '1 day 2 hours'),

('Install Adobe Acrobat Pro on legal team machines',
 'Legal department (5 users) needs Adobe Acrobat Pro DC for document redaction. License keys approved by IT manager. Deploy via SCCM.',
 'in_progress', 'medium', my_uid, my_uid, my_org, NOW() - INTERVAL '1 day 5 hours'),

('Email not syncing on mobile devices',
 'Multiple users reporting emails not syncing on iOS devices after the Exchange migration last weekend. Android users seem fine.',
 'open', 'high', my_uid, my_uid, my_org, NOW() - INTERVAL '2 days'),

('Network slow on 3rd floor',
 'Users on the 3rd floor reporting extremely slow network speeds. Speed test shows 5 Mbps down vs expected 100 Mbps. Started after maintenance window Saturday night.',
 'open', 'critical', my_uid, my_uid, my_org, NOW() - INTERVAL '2 days 4 hours'),

('Request for dual monitor setup',
 'Developer Mike requests a second 27" monitor for his workstation. Manager has approved. Need to order and install.',
 'closed', 'low', my_uid, my_uid, my_org, NOW() - INTERVAL '3 days'),

('Antivirus alert on server SRV-DB01',
 'CrowdStrike flagged suspicious activity on database server. Likely false positive from scheduled backup script but needs verification per security protocol.',
 'closed', 'critical', my_uid, my_uid, my_org, NOW() - INTERVAL '3 days 6 hours'),

('Zoom audio not working in boardroom',
 'Boardroom Zoom setup has no audio output. Display works fine. Tried the USB speakerphone - no sound. CEO has investor call tomorrow.',
 'open', 'high', my_uid, my_uid, my_org, NOW() - INTERVAL '4 days'),

('Onboard 3 new developers - DevOps team',
 'Three new hires starting next Monday. Need: GitHub access, AWS console, Jenkins, Slack channels (dev, devops, alerts), VPN, and standard dev laptop setup.',
 'in_progress', 'medium', my_uid, my_uid, my_org, NOW() - INTERVAL '5 days'),

('Backup job failed on NAS-01',
 'Nightly backup to NAS-01 failed at 2:47 AM. Error: "Insufficient disk space." Need to clean old snapshots or expand storage.',
 'closed', 'high', my_uid, my_uid, my_org, NOW() - INTERVAL '5 days 3 hours'),

('Windows 11 upgrade approval request',
 'Requesting approval to upgrade pilot group (10 machines) from Windows 10 to Windows 11. Compatibility testing completed successfully.',
 'pending', 'low', my_uid, NULL, my_org, NOW() - INTERVAL '6 days'),

('SSL certificate expiring on intranet portal',
 'SSL cert for internal.company.com expires in 7 days. Need to renew via DigiCert and deploy to IIS server.',
 'open', 'critical', my_uid, my_uid, my_org, NOW() - INTERVAL '7 days'),

('Keyboard not working - Reception desk',
 'Wireless keyboard at reception stopped working. Changed batteries, re-paired USB receiver - still dead. Need replacement.',
 'closed', 'low', my_uid, my_uid, my_org, NOW() - INTERVAL '8 days'),

('Set up VPN access for remote contractor',
 'External contractor needs VPN access for 3-month project. NDA signed. Need limited access to dev environment only.',
 'closed', 'medium', my_uid, my_uid, my_org, NOW() - INTERVAL '9 days'),

('Migrate team mailbox to shared mailbox',
 'Marketing wants to convert team@company.com from a regular mailbox to an Exchange shared mailbox. 5 users need send-as permissions.',
 'closed', 'medium', my_uid, my_uid, my_org, NOW() - INTERVAL '10 days'),

('Firewall rule request for new application',
 'New CRM application needs outbound access to api.salesforce.com on port 443. Change request #CR-2024-089 approved.',
 'closed', 'high', my_uid, my_uid, my_org, NOW() - INTERVAL '12 days'),

('Laptop screen cracked - urgent replacement',
 'CFO dropped laptop. Screen completely shattered. Has board presentation Thursday. Need loaner laptop ASAP with data migrated.',
 'closed', 'critical', my_uid, my_uid, my_org, NOW() - INTERVAL '14 days'),

('Set up new conference room display',
 'IT closet in room 305 converted to a huddle room. Need: 55" display, HDMI/wireless casting, and Zoom Room license.',
 'pending', 'low', my_uid, NULL, my_org, NOW() - INTERVAL '15 days'),

('Azure AD sync not working',
 'Azure AD Connect last synced 18 hours ago. New users created in on-prem AD not appearing in Azure/M365. Delta sync failing with error 0x80070005.',
 'closed', 'critical', my_uid, my_uid, my_org, NOW() - INTERVAL '18 days'),

('Request for project management tool',
 'PM team wants to evaluate Jira vs Monday.com vs Asana. Need trial licenses set up for 10 users. Budget approved by VP Engineering.',
 'closed', 'low', my_uid, my_uid, my_org, NOW() - INTERVAL '20 days');

-- ────────────────────────────────────────────────
-- Knowledge Base Articles (10 articles)
-- ────────────────────────────────────────────────
INSERT INTO articles (title, content, status, category, created_by, created_at) VALUES
('How to Connect to the Company VPN',
 '## VPN Setup Guide

### Prerequisites
- Company laptop with Windows 10/11 or macOS
- Active Directory credentials
- GlobalProtect VPN client installed

### Steps
1. Open GlobalProtect from the system tray
2. Enter the portal address: `vpn.company.com`
3. Click **Connect**
4. Enter your AD username and password
5. Complete MFA verification on your phone
6. Wait for "Connected" status

### Troubleshooting
- **"Connection timed out"**: Check your internet connection, try a different network
- **"Invalid credentials"**: Ensure Caps Lock is off, try resetting your password
- **"Certificate error"**: Contact IT to update your VPN client

> If issues persist, create a ticket with priority **High**.',
 'published', 'networking', my_uid, NOW() - INTERVAL '30 days'),

('Password Reset Procedure',
 '## Self-Service Password Reset

### Option 1: Self-Service Portal
1. Go to `https://passwordreset.company.com`
2. Enter your email address
3. Verify your identity via SMS or authenticator app
4. Create a new password (min 12 chars, 1 uppercase, 1 number, 1 special)

### Option 2: Contact IT
If self-service is unavailable:
1. Call IT Helpdesk: ext. 5555
2. Verify your identity (employee ID + manager name)
3. IT will issue a temporary password
4. You **must** change it on first login

### Password Policy
- Minimum 12 characters
- Cannot reuse last 10 passwords
- Expires every 90 days
- Account locks after 5 failed attempts',
 'published', 'security', my_uid, NOW() - INTERVAL '28 days'),

('Setting Up a New Employee Workstation',
 '## New Employee Workstation Checklist

### Hardware
- [ ] Laptop/Desktop assigned and asset-tagged
- [ ] Monitor(s), keyboard, mouse
- [ ] Headset for video calls
- [ ] Docking station (if laptop)

### Software Installation
1. **Windows/macOS**: Latest OS with all updates
2. **Office 365**: Word, Excel, PowerPoint, Outlook, Teams
3. **Security**: CrowdStrike, BitLocker/FileVault enabled
4. **VPN**: GlobalProtect client
5. **Browser**: Chrome + company extensions
6. **Department-specific**: As per manager request

### Account Setup
- Active Directory account created
- Email provisioned in Exchange Online
- Added to relevant distribution groups
- SharePoint/Teams access configured
- Printer drivers installed for floor

### Handoff
- Walk user through login process
- Verify all applications work
- Provide welcome packet with IT contacts',
 'published', 'general', my_uid, NOW() - INTERVAL '25 days'),

('Troubleshooting Printer Issues',
 '## Common Printer Problems & Fixes

### Printer Shows Offline
1. Check physical connection (USB/network cable)
2. Restart the printer
3. On your PC: Settings → Printers → right-click → "Use Printer Online"
4. Try removing and re-adding the printer

### Print Jobs Stuck in Queue
1. Open Services (`services.msc`)
2. Stop **Print Spooler** service
3. Delete files in `C:\Windows\System32\spool\PRINTERS`
4. Start Print Spooler service
5. Retry printing

### Poor Print Quality
- Run printer self-test / cleaning cycle
- Check toner/ink levels
- Ensure correct paper type is selected
- Update printer drivers

### Network Printer Not Found
- Verify printer IP: check printer display or config page
- Ping the printer IP from command prompt
- Add printer manually using IP: `\\\\PRINTER-IP`',
 'published', 'hardware', my_uid, NOW() - INTERVAL '22 days'),

('Email Setup on Mobile Devices',
 '## Configure Company Email on Your Phone

### iOS (iPhone/iPad)
1. Go to **Settings → Mail → Accounts → Add Account**
2. Select **Microsoft Exchange**
3. Enter your company email address
4. Sign in with your AD credentials
5. Complete MFA verification
6. Choose what to sync (Mail, Calendar, Contacts)

### Android
1. Open **Gmail** or **Outlook** app
2. Tap **Add Account → Exchange/Office 365**
3. Enter your company email
4. Sign in and approve MFA
5. Configure sync settings

### Troubleshooting
- Ensure your device OS is up to date
- Check that Intune Company Portal is installed
- If email stops syncing, remove and re-add the account
- Verify your device is compliant in the Intune portal',
 'published', 'email', my_uid, NOW() - INTERVAL '20 days'),

('Active Directory Group Policy Overview',
 '## Understanding Group Policy in Our Environment

### What is Group Policy?
Group Policy Objects (GPOs) are used to manage and configure operating systems, applications, and user settings across the organization.

### Key GPOs in Our Environment
| GPO Name | Scope | Purpose |
|----------|-------|---------|
| Default Domain Policy | All users | Password policy, account lockout |
| Workstation Security | All PCs | BitLocker, firewall, Windows Update |
| Software Deployment | By OU | Auto-install approved software |
| Drive Mappings | By department | Map network drives |

### Common Issues
- **"Access Denied" after GPO change**: Run `gpupdate /force` and restart
- **Software not installing**: Verify machine is in correct OU
- **Drive not mapping**: Check AD group membership

### Requesting Changes
Submit a Change Request ticket with:
- What needs to change
- Which users/machines are affected
- Business justification
- Rollback plan',
 'published', 'active-directory', my_uid, NOW() - INTERVAL '18 days'),

('Software Installation Request Process',
 '## How to Request New Software

### Step 1: Check the Software Catalog
Before requesting, check if the software is already available:
- Open **Software Center** on your PC
- Browse available applications
- If found, click Install (no ticket needed)

### Step 2: Submit a Request
If not in the catalog:
1. Create a new ticket in PulseOps
2. Category: Software
3. Include:
   - Software name and version
   - Business justification
   - Number of licenses needed
   - Manager approval (CC your manager)

### Step 3: Approval Process
1. IT reviews compatibility and security
2. Procurement checks licensing costs
3. Manager approval for budget
4. IT deploys via SCCM or manual install

### Timeline
- **Catalog software**: Immediate (self-service)
- **New software**: 3-5 business days
- **Enterprise software**: 1-2 weeks (procurement)',
 'published', 'software', my_uid, NOW() - INTERVAL '15 days'),

('Network Troubleshooting Guide',
 '## Basic Network Troubleshooting

### Step 1: Check Physical Connection
- Wired: Is the Ethernet cable plugged in? Try a different port.
- Wireless: Is WiFi enabled? Are you connected to **Corp-WiFi** (not Guest)?

### Step 2: Run Diagnostics
```
# Open Command Prompt and run:
ipconfig /all          # Check IP configuration
ping 8.8.8.8           # Test internet connectivity
ping dc01.company.com  # Test internal DNS
nslookup company.com   # Verify DNS resolution
tracert google.com     # Trace route to internet
```

### Step 3: Quick Fixes
1. Disable/enable network adapter
2. Run `ipconfig /flushdns`
3. Run `netsh winsock reset` (requires restart)
4. Forget and reconnect to WiFi

### Step 4: Escalate
If the above does not help, create a ticket with:
- Your IP address (`ipconfig` output)
- Floor and room number
- When the issue started
- Screenshot of any error messages',
 'published', 'networking', my_uid, NOW() - INTERVAL '12 days'),

('BitLocker Recovery Key Guide',
 '## What to Do When BitLocker Asks for a Recovery Key

### Why Am I Seeing This?
BitLocker may prompt for a recovery key after:
- BIOS/firmware update
- Hardware changes
- Too many incorrect PIN attempts
- Secure Boot changes

### Finding Your Recovery Key
1. **Self-service**: Go to `https://myaccount.microsoft.com` → Devices → View BitLocker Keys
2. **Contact IT**: Call ext. 5555 with your device serial number
3. **Azure AD**: IT can retrieve it from Azure AD device management

### After Entering the Key
1. Windows should boot normally
2. If it keeps asking, contact IT — the TPM may need to be re-provisioned
3. Document the incident in a ticket for tracking

### Prevention
- Always shut down properly before BIOS updates
- Do not modify boot configuration without IT guidance',
 'published', 'security', my_uid, NOW() - INTERVAL '8 days'),

('Teams Meeting Room Setup Guide',
 '## Setting Up a Microsoft Teams Room

### Equipment Checklist
- Certified Teams Room device (Poly, Logitech, etc.)
- Display screen (minimum 55" for boardrooms)
- USB camera and speakerphone
- Network connection (wired preferred)

### Configuration
1. Sign in with the room resource account
2. Configure display settings (resolution, scaling)
3. Set default camera and audio devices
4. Enable proximity join (Bluetooth beaconing)
5. Test with a dummy meeting

### User Instructions
1. Book the room via Outlook calendar
2. Walk in — the meeting appears on the room display
3. Tap **Join** on the touch panel
4. Use the room camera and speakers (your laptop mic/camera will mute)

### Troubleshooting
- **No meeting showing**: Check room account calendar, verify booking
- **No audio**: Check USB connections, restart the device
- **Camera not working**: Unplug/replug USB, check Teams Room settings',
 'draft', 'hardware', my_uid, NOW() - INTERVAL '3 days');

-- ────────────────────────────────────────────────
-- Activity Logs (auto-generated from ticket creates)
-- ────────────────────────────────────────────────
INSERT INTO activity_logs (user_id, user_email, action, entity, entity_id, description, metadata)
SELECT my_uid,
       (SELECT email FROM auth.users WHERE id = my_uid),
       'created',
       'ticket',
       id::text,
       'Created ticket: ' || title,
       jsonb_build_object('title', title)
FROM tickets WHERE created_by = my_uid
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Seed data inserted successfully for user %', my_uid;
END $$;
