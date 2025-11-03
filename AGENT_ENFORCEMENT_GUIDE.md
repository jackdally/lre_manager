# Agent Enforcement Guide - Development Rules

This document explains how development rules are enforced for AI agents and human developers.

## Enforcement Mechanisms

### 1. Git Hooks (Automated Enforcement)

Git hooks are installed in `.git/hooks/` and run automatically:

#### `commit-msg` Hook
- **What it does**: Validates commit message format
- **Enforces**:
  - Commit message cannot be empty
  - Must start with valid type (`feat`, `fix`, `docs`, etc.)
  - Minimum length requirement
  - Warns about vague messages
- **When it runs**: Every time you commit
- **Bypass**: `git commit --no-verify` (not recommended)

#### `pre-commit` Hook
- **What it does**: Validates before commit is created
- **Enforces**:
  - Prevents direct commits to `main` or `develop`
  - Validates branch naming convention
  - Checks TypeScript compilation (if TS files changed)
- **When it runs**: Before each commit
- **Bypass**: `git commit --no-verify` (not recommended)

#### `pre-push` Hook
- **What it does**: Validates before pushing to remote
- **Enforces**:
  - Warns if feature branch is behind `develop`
  - Suggests syncing with develop before pushing
- **When it runs**: Before each push
- **Bypass**: `git push --no-verify` (not recommended)

### 2. Cursor Rules File (`.cursorrules`)

- **What it does**: Provides instructions to AI agents in Cursor
- **Contains**:
  - Git workflow rules
  - Branch strategy requirements
  - Commit message format requirements
  - Step-by-step workflow instructions
- **When it's used**: AI agents read this file automatically
- **Location**: `.cursorrules` in project root

### 3. Documentation Files

#### `.git-branch-strategy.md`
- Overview of branch strategy
- Quick reference for workflows
- Links to detailed guides

#### `FEATURE_DEVELOPMENT_GUIDE.md`
- Comprehensive development guide
- Step-by-step instructions
- Best practices and examples
- Troubleshooting guide

## How Agents Should Follow Rules

### For AI Agents (Cursor, GitHub Copilot, etc.)

1. **Read `.cursorrules` first** - This file contains all the rules
2. **Check current branch** before making any commits:
   ```bash
   git branch
   ```
3. **If on main/develop**: Create a feature branch first
4. **Use proper commit format**: `<type>: <description>`
5. **Reference documentation**: Check `FEATURE_DEVELOPMENT_GUIDE.md` for detailed steps

### For Human Developers

1. **Install git hooks** (first time setup):
   ```bash
   ./scripts/install-git-hooks.sh
   ```

2. **Follow the workflow**:
   - Always work on feature branches
   - Use proper commit messages
   - Merge to develop when complete

3. **If hooks block you**: Read the error message and follow the instructions

## Testing the Enforcement

### Test Commit Message Validation:
```bash
# This should fail (wrong format)
git commit -m "update stuff"

# This should pass (correct format)
git commit -m "feat: Add new feature"
```

### Test Branch Protection:
```bash
# Try committing to main (should fail)
git checkout main
git commit --allow-empty -m "feat: test"  # Should be blocked

# Try committing to develop (should fail)
git checkout develop
git commit --allow-empty -m "feat: test"  # Should be blocked
```

### Test Branch Naming:
```bash
# Create branch with wrong name
git checkout -b bad-branch-name
# Try to commit - will warn about naming convention
```

## Troubleshooting

### Hook Not Running?
- Check if hooks are executable: `ls -la .git/hooks/`
- Install hooks: `./scripts/install-git-hooks.sh`
- Verify hooks exist: `ls .git/hooks/commit-msg .git/hooks/pre-commit .git/hooks/pre-push`

### Need to Bypass Hooks?
- Use `--no-verify` flag (not recommended):
  ```bash
  git commit --no-verify -m "message"
  git push --no-verify
  ```
- **Warning**: Only use when absolutely necessary and understand the risks

### Hooks Causing Issues?
- Check hook output for specific error messages
- Review `.git/hooks/` files to understand what's being checked
- Fix the underlying issue rather than bypassing

## Best Practices for Agents

1. ✅ **Always check branch before committing**
   ```bash
   git branch
   ```

2. ✅ **Always create feature branches from develop**
   ```bash
   git checkout develop && git pull && git checkout -b feature/name
   ```

3. ✅ **Always use proper commit message format**
   ```bash
   git commit -m "feat: Clear description of what you did"
   ```

4. ✅ **Always test before committing**
   - Run build checks
   - Fix TypeScript errors
   - Test functionality

5. ✅ **Read error messages carefully**
   - Git hooks provide helpful error messages
   - Follow the suggestions in the error output

## Summary

**Three layers of enforcement:**
1. **Git hooks** - Automated checks at commit/push time
2. **Cursor rules** - Instructions for AI agents
3. **Documentation** - Reference guides for all developers

**Key Rules:**
- ❌ Never commit directly to `main` or `develop`
- ✅ Always use feature branches
- ✅ Always use proper commit message format
- ✅ Always merge to `develop` (not `main`)

**Result**: Consistent, high-quality commits and proper branch management across all development work.

