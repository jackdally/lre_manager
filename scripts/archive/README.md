# Scripts Archive

This directory contains scripts that are no longer actively used but are preserved for reference and documentation purposes.

## Archive Strategy

### Why Archive Instead of Delete?
- **Historical Reference**: Understand what changes were made and when
- **Rollback Knowledge**: Know what was changed in case issues arise
- **Team Onboarding**: New team members can understand project evolution
- **Git History**: Preserves the complete development timeline

### Archive Categories

- **migrations/**: One-time migration scripts that have been executed
- **cleanup/**: Cleanup scripts that have completed their work
- **deprecated/**: Scripts that are no longer relevant due to technology changes

### When to Archive vs. Delete

**Archive When:**
- Scripts made significant structural changes
- Scripts modified multiple files across the codebase
- Scripts are part of a major refactoring effort
- Scripts contain business logic that might be referenced later

**Delete When:**
- Scripts are simple file moves or renames
- Scripts only modified configuration files
- Scripts are clearly obsolete due to technology changes
- Scripts were experimental and never used in production

## Best Practices

1. **Document Everything**: Always include a README explaining what the script did
2. **Date Your Changes**: Note when scripts were executed
3. **Keep Git History**: Don't delete from git, just move to archive
4. **Review Periodically**: Clean up archive every 6-12 months
5. **Tag Releases**: Use git tags to mark when major migrations were completed 