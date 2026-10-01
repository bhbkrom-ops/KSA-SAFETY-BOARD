# INBOUND MAIL CONFIGURATION

Route: `/admin/inbound-config`
Current component delegates to the Email Settings surface.

This route exists but is not currently a primary sidebar item.

## Required audit
Determine whether inbound mail is:
- intentionally an alias/redirect to secure email configuration; or
- intended to become a distinct inbound-email ingestion configuration module.

Do not create duplicate insecure SMTP credential storage.

## Security rules
- no plaintext SMTP/API secrets in browser
- no plaintext credential persistence in deprecated `email_config`
- use Vercel/server-side secret configuration
- provider runtime status via `/api/notification-delivery`
- secrets managed through secure notification provider settings/service path

If inbound email ingestion is implemented, define:
- provider
- mailbox/address
- authentication method
- message parsing
- attachment restrictions
- mapping into HSE Inbox / Reports
- sender allow/block policy
- audit log
- retry/dead-letter behavior
- retention
- malware/file validation
