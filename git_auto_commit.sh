#!/bin/bash

# Configuration
REPO_DIR="/home/fvegi/DEV/Netlify presentation/alarm incendie prospection"
COMMIT_MSG="Auto-update: 2026 Prospection Data & UI Fixes [$(date +'%Y-%m-%d %H:%M:%S')]"

cd "$REPO_DIR"

echo "🚀 Starting auto-commit process..."

# Add all changes
git add .

# Check if there are changes
if git diff --cached --quiet; then
    echo "✅ No changes to commit."
else
    # Commit
    git commit -m "$COMMIT_MSG"
    
    # Push
    echo "📤 Pushing to GitHub..."
    git push origin master
    
    if [ $? -eq 0 ]; then
        echo "🎉 Successfully pushed. Netlify deployment triggered."
    else
        echo "❌ Failed to push to GitHub."
        exit 1
    fi
fi

echo "✨ Done."
