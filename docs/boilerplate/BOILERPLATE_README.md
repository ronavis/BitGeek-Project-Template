# Boilerplate Templates

This directory contains standardized templates for project documentation and related files. These templates promote consistency and make it easier to create new documentation by providing reusable structures.

## Available Templates

- **DIRECTORY_STRUCTURE_TEMPLATE.md**: Template for creating directory structure documentation
- **TICKET_TEMPLATE.md**: Template for creating new tickets
- **README_TEMPLATE.md**: Template for creating README files for new modules or directories
- **DIRECTORY_README_TEMPLATE.md**: Template for creating README files for directories
- **VERSION_TEMPLATE**: Template for the VERSION file
- **CHANGELOG_TEMPLATE.md**: Template for creating or updating the CHANGELOG
- **CONTRIBUTING_TEMPLATE.md**: Template for creating CONTRIBUTING.md with versioning policy

## Usage Guidelines

### Ticket Templates
- Replace AV-XXX with the correct ticket number
- Choose one option from Type and Priority sections
- Fill in all sections with relevant information
- Delete any sections that aren't relevant

### Documentation Templates
- Follow the established format
- Always include "Made with love by BitGeek Software" at the end
- Update version numbers when applicable

### Changelog Templates
- Follow semantic versioning for new entries
- Include ticket numbers for all changes
- Group related changes under appropriate headings
- Provide sufficient detail for each change

### Directory README Templates
- Replace "Directory Name" with the actual directory name
- Replace "DIRECTORY_PURPOSE" with the purpose of the directory
- List all subdirectories with descriptions
- Customize the purpose section to match the directory's function

### Contributing Template
- Update "Project Name" with the actual project name
- Customize code style guidelines if needed
- Ensure versioning policy matches project requirements
- Add project-specific guidelines if necessary

## Usage Examples

```
# Example: Creating a new ticket
cp docs/boilerplate/TICKET_TEMPLATE.md tickets/AV-XXX_new_feature_name.md

# Example: Creating a README for a new directory
cp docs/boilerplate/README_TEMPLATE.md new_directory/README.md

# Example: Creating a README for a subdirectory
cp docs/boilerplate/DIRECTORY_README_TEMPLATE.md new_directory/README.md

# Example: Creating a CONTRIBUTING.md file
cp docs/boilerplate/CONTRIBUTING_TEMPLATE.md CONTRIBUTING.md
```

Made with love by BitGeek Software 