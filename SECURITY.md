# Security Policy

## Supported Versions

| Version | Supported |
| :--- | :--- |
| 1.0.x (Release Candidate) | Yes |

## Reporting a Vulnerability

Please do NOT file public GitHub issues for security vulnerabilities. Instead, report any leaks or concerns directly to the project maintainers.

## API Key Security

*   **Never commit credentials**: Google Gemini API Keys and PostgreSQL passwords must never be committed to source code.
*   **Kubernetes Secrets**: Ensure keys are configured strictly via Kubernetes Secrets in production.
