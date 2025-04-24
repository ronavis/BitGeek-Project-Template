# Copper Project Directory Structure

This guide explains the organization of the Copper project directories and where to place different types of files.

## Root Directory

The root directory contains only essential files and directories:

- **app/**: Main application code
- **backup/**: Database backups
- **config/**: Configuration files
- **data/**: Data files and datasets
- **docs/**: Documentation
- **encryption/**: Encryption keys and backups
- **logs/**: Log files
- **media/**: Images, screenshots, and other media
- **root_scripts/**: Utility scripts
- **scripts/**: Application scripts and runners
- **testing/**: Test files and results
- **verification/**: Verification files and screenshots
- **deprecated/**: Deprecated code kept for reference
- **adhoc/**: Ad-hoc scripts with ticket numbers

## Where to Place Files

### Code and Application Files
- **Python modules**: `app/`
- **Templates**: `app/templates/`
- **Static assets** (CSS, JS): `app/static/`
- **Routes/Views**: `app/routes/`
- **Models**: `app/models/`
- **Controllers**: `app/controllers/`
- **Services**: `app/services/`
- **Utilities**: `app/utils/`

### Scripts
- **General scripts**: `scripts/`
- **Runner scripts**: `scripts/runners/`
- **Utility scripts**: `root_scripts/`
- **Ad-hoc scripts with ticket numbers**: `adhoc/`

### Configuration
- **Environment settings**: Root directory (`.env`)
- **Configuration backups**: `config/backups/`
- **Instance-specific config**: `config/instance/`
- **Patches**: `config/patches/`

### Data and Resources
- **Database files**: Root directory (`dev.db`, `test.db`)
- **Database backups**: `backup/`
- **Datasets**: `data/datasets/`
- **Demo data**: `data/demo/`
- **Agent plans**: `data/agent_plans/`

### Documentation
- **Markdown files**: `docs/`
- **API documentation**: `docs/API_ENDPOINTS.md`
- **Implementation guides**: `docs/`
- **Templates**: `docs/templates/`

### Logs and Debugging
- **Log files**: `logs/`
- **Debug files**: `debug/`
- **Debug screenshots**: `media/debug/`

### Testing
- **Unit tests**: `testing/unit/`
- **Functional tests**: `testing/functional/`
- **Test results**: `testing/results/`
- **User testing**: `testing/user/`

### Verification
- **Verification results**: `verification/results/`
- **Verification screenshots**: `verification/screenshots/`
- **Dashboard verification**: `verification/dashboard/`
- **Amazon verification**: `verification/amazon/`
- **Walmart verification**: `verification/walmart/`
- **Login verification**: `verification/login/`

### Media and Assets
- **General screenshots**: `media/screenshots/`
- **Debug screenshots**: `media/debug/`
- **Reference screenshots**: `media/reference/`
- **Assets**: `media/assets/`

### Security
- **Encryption keys**: `encryption/keys/`
- **Encryption backups**: `encryption/backups/`
- **Reset backups**: `encryption/reset_backups/`

## Finding Files

1. **Scripts**: Check `scripts/`, `root_scripts/`, or `adhoc/`
2. **Documentation**: Check `docs/`
3. **Configuration**: Check `config/` or root directory
4. **Images/Media**: Check `media/`
5. **Test-related**: Check `testing/`
6. **Verification**: Check `verification/`
7. **Logs**: Check `logs/`

## Maintaining Directory Structure

When adding new files:
1. Identify the appropriate directory based on the file's purpose
2. If unsure, refer to this guide
3. Never create directories directly in the root without approval
4. Use descriptive file names with date stamps for temporal files (e.g., `backup_20250424.db`)
5. Include ticket numbers in file names for files related to specific tickets (e.g., `AV-275_report.md`)

## Best Practices

1. **Clean up temporary files**: Remove temporary files when they are no longer needed
2. **Document changes**: Update the CHANGELOG.md when making significant changes
3. **Follow naming conventions**: Use snake_case for file and directory names
4. **Create READMEs**: Add README.md files to directories to explain their purpose
5. **Version control**: Include version numbers in important documents and files

## Directory Structure Diagram

```
copper/
├── app/                         # Main application code
├── backup/                      # Database backups
├── config/                      # Configuration files
│   ├── backups/                 # Configuration backups
│   ├── instance/                # Instance-specific configuration
│   └── patches/                 # Patches
├── data/                        # Data files and datasets
│   ├── agent_plans/             # Agent planning data
│   ├── demo/                    # Demo profile data
│   └── datasets/                # General datasets
├── docs/                        # Documentation
├── encryption/                  # Encryption keys and backups
│   ├── keys/                    # Current active encryption keys
│   ├── backups/                 # Regular key backups
│   └── reset_backups/           # Backups created during key resets
├── logs/                        # Log files
├── media/                       # Images and screenshots
│   ├── assets/                  # General assets
│   ├── debug/                   # Debug screenshots
│   ├── reference/               # Reference screenshots
│   └── screenshots/             # General screenshots
├── root_scripts/                # Utility scripts
├── scripts/                     # Application scripts
│   └── runners/                 # Runner scripts
├── testing/                     # Test files and results
│   ├── address_results/         # Address selector results
│   ├── functional/              # Functional tests
│   ├── ml_results/              # Machine learning behavior results
│   ├── results/                 # Test results
│   ├── unit/                    # Unit tests
│   └── user/                    # User testing materials
├── verification/                # Verification files and screenshots
│   ├── amazon/                  # Amazon verification
│   ├── dashboard/               # Dashboard verification
│   ├── login/                   # Login verification
│   ├── results/                 # Verification results
│   ├── screenshots/             # Verification screenshots
│   └── walmart/                 # Walmart verification
├── deprecated/                  # Deprecated code
├── adhoc/                       # Ad-hoc scripts with ticket numbers
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── LICENSE                      # License file
├── README.md                    # Main README
├── requirements.txt             # Python dependencies
├── VERSION                      # Version file
└── CHANGELOG.md                 # Change log
```

Made with love by BitGeek Software 