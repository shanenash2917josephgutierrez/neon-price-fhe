#!/bin/bash

# PriceGuess Auto Git Commit Script
# Automatically commits and pushes changes with correct author info

set -e  # Exit on error

# Load author info from .env
if [ -f ".env" ]; then
  export $(grep -E '^(GITHUB_USERNAME|GITHUB_EMAIL)=' .env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

# Configure git with author info
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"

echo "✅ Git configured with author: $GITHUB_USERNAME <$GITHUB_EMAIL>"
echo ""

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit"
  exit 0
fi

# Show status
echo "📝 Current changes:"
git status --short
echo ""

# Check if commit message is provided as argument
if [ -z "$1" ]; then
  # No commit message provided, use default
  COMMIT_MSG="chore: Auto-commit changes

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
else
  # Use provided commit message
  COMMIT_MSG="$1

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

# Add all changes
echo "➕ Adding all changes..."
git add -A

# Commit
echo "💾 Committing with message:"
echo "\"$COMMIT_MSG\""
echo ""
git commit -m "$COMMIT_MSG"

# Push
echo "⬆️  Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Successfully committed and pushed to GitHub!"
echo "📍 Repository: https://github.com/$GITHUB_USERNAME/neon-price-fhe"
