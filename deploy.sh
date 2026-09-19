#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Preparing to deploy to GitHub Pages..."

# Add all changes
git add .

# Commit changes (if there are any)
git commit -m "Deploy to GitHub Pages" || echo "No changes to commit."

# Push to the default branch (usually main or master)
echo "📦 Pushing changes to the repository..."
git push origin HEAD

# Push the current state to the gh-pages branch to trigger GitHub Pages
echo "🌐 Pushing to gh-pages branch..."
git push origin HEAD:refs/heads/gh-pages --force

echo "✅ Deployment complete!"
echo "Your site should be live in a few minutes at:"
echo "👉 https://ArtyomVorontsov.github.io/web-programming-shakespeare-task/"
