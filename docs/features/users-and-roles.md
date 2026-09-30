# Users and roles flow

1. An admin with MFA opens **Settings → Users and roles**. A non-AAL2 admin is sent to the MFA page.
2. The admin chooses Admin, Staff, or Trainer for another profile. The control saves optimistically and restores the previous role if the request fails.
3. The database function checks the authenticated admin and AAL2 claim, prevents self-change and removal of the last admin, changes the profile, and writes an audit-log row in one transaction.

The page is read-only for non-admin users. New account creation/invitations and email addresses are not part of this page.
