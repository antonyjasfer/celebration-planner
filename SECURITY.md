# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in CelebriPlan, please report it responsibly by opening a GitHub issue with the label `security`.

## Security Practices

### API Key Management
- API keys are **never hardcoded** in source code
- Keys are stored in environment variables (`.env` files excluded from version control)
- Session-level key storage uses `localStorage` with user consent
- The `.gitignore` file explicitly excludes all `.env` files

### Input Sanitization
- All user inputs are sanitized before rendering to prevent XSS attacks
- Budget amounts and guest counts are validated and bounded
- API key format is validated before storage

### Client-Side Security
- Content Security Policy headers restrict resource loading
- `X-Content-Type-Options: nosniff` prevents MIME type sniffing
- `X-Frame-Options: DENY` prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin` limits referrer information
- All external links use `rel="noopener noreferrer"`

### Data Storage
- All event data is stored client-side in `localStorage`
- No sensitive data is transmitted to third-party servers (except Gemini API for AI features)
- Users can clear all stored data at any time

### Dependencies
- Dependencies are regularly audited with `npm audit`
- Only well-maintained, widely-used packages are included
