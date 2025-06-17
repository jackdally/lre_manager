# Configuration Files

This directory contains configuration files for various development tools and environments.

## Files

- `.editorconfig` - Editor configuration for consistent coding styles
- `.prettierrc` - Prettier configuration for code formatting
- `.eslintrc.js` - ESLint configuration for code linting
- `tsconfig.json` - TypeScript configuration

## Usage

These configurations are automatically picked up by their respective tools. No manual configuration is needed.

### EditorConfig

Ensures consistent coding styles across different editors and IDEs. Supported by most modern editors.

### Prettier

Code formatter that enforces a consistent style. Run with:
```bash
npx prettier --write .
```

### ESLint

Code linter that helps catch errors and enforce style rules. Run with:
```bash
npx eslint .
```

### TypeScript

TypeScript configuration for the project. Used by both frontend and backend.

## Customization

To modify these configurations:

1. Make changes to the respective files
2. Update this README if necessary
3. Commit changes with a clear message about what was modified 