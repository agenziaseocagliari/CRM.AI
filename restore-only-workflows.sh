#!/bin/bash
# restore-only-workflows.sh
# Ripristina solo la directory .github/workflows dal remote

git fetch origin
DEFAULT_BRANCH="main"
git checkout origin/$DEFAULT_BRANCH -- .github/workflows/
git add .github/workflows/
git commit -m "fix: restore only .github/workflows after accidental deletion"
git push origin $DEFAULT_BRANCH
