# Contributing to Project Name

Thank you for considering contributing to our project! This document outlines our contribution guidelines and versioning policy.

## Versioning Policy

### Version Number Updates Required
- Every pull request that modifies functionality MUST include appropriate version updates
- Version numbers MUST follow [Semantic Versioning](https://semver.org/)
- Updates MUST be made to:
  - `VERSION` file
  - Version badge in `README.md`
  - `CHANGELOG.md`

### Version Number Guidelines
- MAJOR version (x.0.0): Breaking changes or major redesigns
- MINOR version (0.x.0): New features in a backward compatible manner
- PATCH version (0.0.x): Bug fixes and minor improvements

### CHANGELOG Requirements
- All changes MUST be documented in `CHANGELOG.md`
- New entries MUST be added at the top of the file
- Each entry MUST include:
  - Version number and date
  - Changes categorized as: Added, Changed, Deprecated, Removed, Fixed, or Security

### Git Tag Policy
- After version updates are merged to main:
  ```bash
  git tag -a vX.Y.Z -m "Version X.Y.Z release"
  git push origin vX.Y.Z
  ```

## Example Workflow

1. Making changes:
   ```bash
   git checkout -b feature/new-feature
   # Make your changes
   ```

2. Update version files:
   - Increment version in `VERSION` file
   - Update version badge in `README.md`
   - Add entry in `CHANGELOG.md`

3. Commit and push:
   ```bash
   git add VERSION README.md CHANGELOG.md
   git commit -m "v1.2.0 - Added new feature"
   git push origin feature/new-feature
   ```

4. Create pull request with version updates

## Version Update Checklist

Before submitting a pull request, ensure:

- [ ] Version number is incremented appropriately
- [ ] `VERSION` file is updated
- [ ] Version badge in `README.md` is updated
- [ ] New entry is added at the top of `CHANGELOG.md`
- [ ] Commit message includes version number

## General Contributing Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Update version files as per the policy above
5. Commit your changes (`git commit -m 'v1.2.0 - Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Code Style

- Follow PEP 8 guidelines for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Include docstrings for functions and classes

## Database Changes

For schema changes:
- Create a backup of the affected table
- Use ALTER TABLE statements or migrations
- Only drop specific tables if absolutely necessary
- Restore data after schema changes

Example SQL for schema changes:
```sql
-- Backup users table
CREATE TABLE users_backup AS SELECT * FROM users;
-- Add new column
ALTER TABLE users ADD COLUMN totp_secret VARCHAR(32) UNIQUE;
-- Restore data if needed
INSERT INTO users SELECT * FROM users_backup;
```

## Ticket Naming Convention

All ad-hoc test scripts must have a ticket# appended to it, and the ticket must be created and stored in the tickets folder.
Example: `AV-175_improved_verification_guide.py`

Made with love by BitGeek Software 