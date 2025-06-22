#!/bin/sh

if [ -d ".git" ]; then
  echo "Detected Git repository. Setting up Husky..."
  ./node_modules/.bin/husky install

  # Add commit-msg hook if not already set
  ./node_modules/.bin/husky set .husky/commit-msg "npx commitlint --edit \$1"
else
  echo "No .git directory found. Skipping Husky setup."
fi
