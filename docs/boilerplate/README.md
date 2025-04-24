# 🚀 BitGeek Software Development Standards

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](VERSION)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Welcome to BitGeek Software's development standards and project bootstrapping repository! This resource contains everything you need to understand our development practices and get started with a new project.

## 🔗 Quick Links

- [📁 Directory Structure](docs/boilerplate/DIRECTORY_STRUCTURE_TEMPLATE.md)
- [🤝 Contribution Guidelines](docs/boilerplate/CONTRIBUTING_TEMPLATE.md)
- [🎫 Issue Templates](docs/boilerplate/TICKET_TEMPLATE.md)
- [📝 Changelog Standards](docs/boilerplate/CHANGELOG_TEMPLATE.md)

## 💡 Development Philosophy

At BitGeek Software, we prioritize:

- **✨ Code Quality**: Maintainable, well-tested, and readable code
- **📚 Documentation**: Thorough documentation for all systems and processes
- **🔄 Consistency**: Common patterns and practices across all projects
- **🔒 Security**: Proactive security measures at every development stage
- **👥 Collaboration**: Clear communication and knowledge sharing

## 📂 Project Structure

Every BitGeek Software project follows a standardized directory structure:

```
project/
├── app/                         # Main application code
├── docs/                        # Documentation
│   ├── boilerplate/             # Documentation templates
│   └── ...
├── scripts/                     # Application scripts
├── testing/                     # Test files and results
├── .env                         # Environment variables
├── LICENSE                      # License file
├── README.md                    # Main README
├── requirements.txt             # Dependencies
├── VERSION                      # Version file
└── CHANGELOG.md                 # Change log
```

For detailed directory structure guidelines, see our [📁 Directory Structure Template](docs/boilerplate/DIRECTORY_STRUCTURE_TEMPLATE.md).

## 🏁 Getting Started

### 📋 Prerequisites

- Python 3.7+
- Git
- Virtual environment tool (venv, pipenv, or conda)

### 🔧 Project Setup

1. Clone this repository as a template:

```bash
git clone https://github.com/ronavis/bitgeek-standards.git my-new-project
cd my-new-project
```

2. Set up a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Initialize the project structure:

```bash
python scripts/init_project.py --name "My Project Name"
```

5. Update the README.md and other documentation files with your project specifics.

## 📚 Documentation Standards

All BitGeek Software projects maintain comprehensive documentation:

- **README.md**: Project overview, quick start, and essential information
- **API_ENDPOINTS.md**: API documentation when applicable
- **CONTRIBUTING.md**: Contribution guidelines
- **CHANGELOG.md**: Record of all notable changes
- **Directory READMEs**: Purpose explanation for each major directory

Documentation should be written in Markdown and follow our templates in the `docs/boilerplate/` directory.

## 🔢 Versioning Policy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR version (x.0.0)**: Incompatible API changes
- **MINOR version (0.x.0)**: Backwards-compatible new functionality
- **PATCH version (0.0.x)**: Backwards-compatible bug fixes

All version changes must update:
- `VERSION` file
- Version badge in `README.md`
- `CHANGELOG.md`

After version updates are merged to main, we create and push a Git tag:
```bash
git tag -a vX.Y.Z -m "Version X.Y.Z release"
git push origin vX.Y.Z
```

## 🎫 Issue & Ticketing System

- All issues/tickets use our [standard template](docs/boilerplate/TICKET_TEMPLATE.md)
- Ticket IDs follow the pattern: `PROJECT-XXX` (e.g., `AV-175`)
- Ad-hoc scripts must reference ticket numbers (e.g., `AV-175_improved_verification_guide.py`)
- Tickets should contain comprehensive information including implementation details and validation criteria

## 💻 Code Style

- **Python**: Follow PEP 8 guidelines
- **Variable names**: Use descriptive names in the appropriate style for the language
- **Comments**: Add comments for complex logic
- **Docstrings**: Include for all functions and classes
- **Dependencies**: Always specify versions in requirements files

## 🗃️ Database Changes

For schema changes:
- Create a backup of affected tables
- Use ALTER TABLE statements or migrations
- Only drop specific tables if absolutely necessary
- Restore data after schema changes

Example approach:
```sql
-- Backup users table
CREATE TABLE users_backup AS SELECT * FROM users;
-- Add new column
ALTER TABLE users ADD COLUMN totp_secret VARCHAR(32) UNIQUE;
-- Restore data if needed
INSERT INTO users SELECT * FROM users_backup;
```

## 🔒 Security Guidelines

- Never commit sensitive information (keys, credentials, etc.)
- Use environment variables for configuration
- Implement proper authentication and authorization
- Validate all user inputs
- Follow the principle of least privilege
- Regularly update dependencies to patch security vulnerabilities

## 🧪 Testing Standards

- Maintain unit tests for core functionality
- Include integration tests for critical systems
- Automate testing through CI/CD pipelines
- Verify security aspects through dedicated security tests
- Document test requirements for new features

## 📌 Additional Resources

- [Internal Wiki](https://bitgeek-internal.example.com)
- [Style Guide](https://bitgeek-internal.example.com/style-guide)
- [Security Checklist](https://bitgeek-internal.example.com/security)
- [Deployment Guide](https://bitgeek-internal.example.com/deployment)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by BitGeek Software