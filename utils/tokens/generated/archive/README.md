# Token Archive

This directory contains archived tokens that are no longer actively used but are maintained for reference or historical purposes.

## Usage

Tokens stored here should be used only for reference or troubleshooting. Do not use archived tokens for active development or testing.

## Archiving Process

When a token is no longer needed for active development:

1. Move it from the parent directory to this archive
2. Consider renaming it to include the date of archiving (e.g., `admin-token-2025-04-16.txt`)
3. Add a brief note about why it was archived if relevant

## Retention Policy

Archived tokens should be periodically reviewed and deleted if they are:

- Older than 90 days
- No longer needed for reference
- Contain outdated permissions or roles
- Have expired and are not needed for historical reference

## Security Considerations

- Even expired tokens may contain sensitive information
- Avoid committing archived tokens to version control
- Consider adding .gitignore patterns to prevent accidentally committing tokens