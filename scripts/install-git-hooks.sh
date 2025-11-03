#!/bin/bash
#
# Install git hooks for development workflow enforcement
#

echo "🔧 Installing git hooks..."

# Make hooks executable
chmod +x .git/hooks/commit-msg
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "Hooks installed:"
echo "  - commit-msg: Validates commit message format"
echo "  - pre-commit: Prevents direct commits to main/develop, validates branch names"
echo "  - pre-push: Warns if branch is behind develop"
echo ""
echo "To skip hooks (not recommended):"
echo "  git commit --no-verify"
echo "  git push --no-verify"

