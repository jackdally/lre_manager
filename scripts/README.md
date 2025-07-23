# Scripts Directory

This directory contains utility scripts for the LRE Manager project.

## Prerequisites

Most scripts require `jq` (JSON processor) for proper JSON parsing. This is automatically installed in Docker containers, but for local development you may need to install it:

```bash
# Install jq locally
./scripts/install-jq.sh
```

## Available Scripts

### `complete-boe-081-test.sh`
Creates a complete BOE-081 test scenario with allocations, ledger entries, and actuals for testing the split and re-forecast functionality.

**Features:**
- Creates test program, vendor, cost categories, WBS elements
- Creates BOE templates, BOEs, BOE elements, and allocations
- Pushes BOE to ledger and prepares actuals for manual testing
- Includes comprehensive cleanup of previous test data
- **Safety checks** to prevent accidental deletion of production programs

**Usage:**
```bash
./scripts/complete-boe-081-test.sh
```

### `install-jq.sh`
Installs jq (JSON processor) on various operating systems for local development.

**Usage:**
```bash
./scripts/install-jq.sh
```

## Safety Features

The scripts include several safety features to prevent accidental data loss:

1. **Program-specific deletion**: Scripts only delete programs with specific codes (e.g., `BOE081C`)
2. **Test program detection**: Safety checks prevent deletion of non-test programs
3. **Comprehensive logging**: All operations are logged with clear status messages
4. **Transaction safety**: Database operations use transactions where possible

## JSON Processing

Scripts use `jq` for reliable JSON parsing instead of basic grep/sed operations. This prevents issues with:
- Malformed JSON responses
- Incorrect field extraction
- Character encoding problems

If `jq` is not available, scripts fall back to `sed` with improved pattern matching.