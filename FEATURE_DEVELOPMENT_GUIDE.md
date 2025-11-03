# Feature Development Guide

## Quick Start: Creating a New Feature Branch

### Step 1: Start from a clean develop branch
```bash
# Make sure you're on develop
git checkout develop

# Pull latest changes from remote
git pull origin develop

# Verify you're up to date
git status
```

### Step 2: Create your feature branch
```bash
# Create and switch to new feature branch
git checkout -b feature/boe-approval-notifications

# Or for bug fixes:
git checkout -b fix/boe-calculation-error

# For small improvements:
git checkout -b chore/boe-code-cleanup
```

### Step 3: Develop your feature
```bash
# Make your changes, then commit frequently with clear messages
git add .
git commit -m "feat: Add approval notification system

- Implement email notifications for BOE approvals
- Add notification preferences to user settings
- Create notification service with retry logic"

# Continue working and committing...
git commit -m "feat: Add notification templates"
git commit -m "test: Add unit tests for notification service"
```

### Step 4: Keep your feature branch updated
```bash
# Periodically sync with develop to avoid conflicts
git checkout develop
git pull origin develop
git checkout feature/boe-approval-notifications

# Merge develop into your feature branch
git merge develop

# OR use rebase (cleaner history, but requires force push)
git rebase develop
```

### Step 5: Push your feature branch
```bash
# Push your feature branch to remote
git push -u origin feature/boe-approval-notifications

# If you rebased, you'll need to force push (be careful!)
# git push -u origin feature/boe-approval-notifications --force-with-lease
```

### Step 6: Merge back to develop
```bash
# Switch to develop
git checkout develop
git pull origin develop

# Merge your feature branch
git merge feature/boe-approval-notifications

# Push to remote
git push origin develop

# Clean up - delete local branch
git branch -d feature/boe-approval-notifications

# Delete remote branch (optional, but recommended)
git push origin --delete feature/boe-approval-notifications
```

## Branch Naming Conventions

Use descriptive names that indicate the type of work:

### Feature Branches
```
feature/boe-approval-workflow
feature/ledger-integration
feature/user-permissions
```

### Bug Fix Branches
```
fix/boe-calculation-error
fix/vendor-upload-issue
fix/memory-leak-in-wizard
```

### Chore/Refactor Branches
```
chore/boe-code-cleanup
chore/update-dependencies
refactor/boe-service-architecture
```

### Documentation Branches
```
docs/api-documentation
docs/user-guide-updates
```

## Commit Message Best Practices

### Format
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies, etc.

### Examples

**Good Commit Messages:**
```bash
feat: Add BOE approval notification system

- Implement email notifications for BOE approvals
- Add notification preferences to user settings
- Create notification service with retry logic

Closes #123
```

```bash
fix: Resolve BOE calculation error for negative values

The calculation service was not handling negative cost
adjustments correctly. Added validation and proper sign handling.

Fixes #456
```

```bash
refactor: Simplify BOE wizard step navigation

Extract navigation logic into separate utility function
to improve maintainability and testability.
```

**Bad Commit Messages:**
```bash
# Too vague
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "WIP"
```

## Keeping Feature Branches Updated

### Method 1: Merge (Recommended for beginners)
```bash
# On your feature branch
git checkout feature/your-feature
git fetch origin
git merge origin/develop
```

**Pros:**
- Preserves full history
- Safe and easy to understand
- No force push needed

**Cons:**
- Creates merge commits
- Can clutter history

### Method 2: Rebase (Cleaner history)
```bash
# On your feature branch
git checkout feature/your-feature
git fetch origin
git rebase origin/develop
```

**Pros:**
- Clean, linear history
- Easier to read git log
- No merge commits

**Cons:**
- Rewrites history (requires force push)
- Can be more complex
- Not recommended for shared branches

**When to use rebase:**
- Working solo on a feature branch
- Before merging to develop
- Want clean history

## Handling Merge Conflicts

### During Merge
```bash
git checkout develop
git pull origin develop
git checkout feature/your-feature
git merge develop

# If conflicts occur:
# 1. Git will show you which files have conflicts
# 2. Open files and look for conflict markers:
#    <<<<<<< HEAD
#    your changes
#    =======
#    changes from develop
#    >>>>>>> develop
# 3. Resolve conflicts manually
# 4. Stage resolved files:
git add path/to/resolved/file
# 5. Complete the merge:
git commit
```

### During Rebase
```bash
git rebase develop

# If conflicts occur:
# 1. Resolve conflicts in each file
# 2. Stage resolved files:
git add path/to/resolved/file
# 3. Continue rebase:
git rebase --continue

# If you want to abort:
git rebase --abort
```

## Feature Development Checklist

### Before Starting
- [ ] Update develop: `git checkout develop && git pull`
- [ ] Create feature branch with descriptive name
- [ ] Push branch to remote early (for backup)

### During Development
- [ ] Commit frequently with clear messages
- [ ] Keep feature branch updated with develop
- [ ] Test your changes thoroughly
- [ ] Ensure code compiles without errors
- [ ] Run linters and fix issues

### Before Merging
- [ ] Sync with latest develop
- [ ] Resolve all conflicts
- [ ] Run tests and ensure they pass
- [ ] Review your own code
- [ ] Update documentation if needed
- [ ] Ensure no console errors

### After Merging
- [ ] Delete local feature branch
- [ ] Delete remote feature branch (optional)
- [ ] Verify changes are in develop
- [ ] Test the merged feature in develop

## Example: Complete Feature Workflow

```bash
# 1. Start fresh
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/boe-email-notifications

# 3. Make changes and commit
git add .
git commit -m "feat: Add email notification service"
git commit -m "test: Add notification service tests"
git commit -m "docs: Update API docs for notifications"

# 4. Push to remote (for backup/collaboration)
git push -u origin feature/boe-email-notifications

# 5. Keep updated (do this periodically)
git checkout develop
git pull origin develop
git checkout feature/boe-email-notifications
git merge develop  # or git rebase develop

# 6. When feature is complete, merge to develop
git checkout develop
git pull origin develop
git merge feature/boe-email-notifications
git push origin develop

# 7. Clean up
git branch -d feature/boe-email-notifications
git push origin --delete feature/boe-email-notifications
```

## Best Practices Summary

1. ✅ **Always start from updated develop**
   - `git checkout develop && git pull origin develop`

2. ✅ **Use descriptive branch names**
   - `feature/boe-approval-system` not `feature/jack-work`

3. ✅ **Commit frequently with clear messages**
   - Small, focused commits are easier to review and revert

4. ✅ **Keep feature branches updated**
   - Merge or rebase develop regularly to avoid large conflicts

5. ✅ **Test before merging**
   - Ensure your feature works before merging to develop

6. ✅ **Delete merged branches**
   - Keep repository clean by removing merged feature branches

7. ✅ **Use pull requests for code review** (if using GitHub/GitLab)
   - Even for solo work, PRs provide a good review process

8. ✅ **Don't merge to main directly**
   - Always go through develop first

9. ✅ **Keep commits focused**
   - One logical change per commit

10. ✅ **Write meaningful commit messages**
    - Future you (and others) will thank you

## Quick Reference Commands

```bash
# Create feature branch
git checkout develop && git pull && git checkout -b feature/name

# Update feature branch
git fetch origin && git merge origin/develop

# Push feature branch
git push -u origin feature/name

# Merge to develop
git checkout develop && git merge feature/name && git push

# Delete feature branch
git branch -d feature/name
git push origin --delete feature/name
```

