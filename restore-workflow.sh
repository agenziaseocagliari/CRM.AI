#!/bin/bash
# Script di restore workflow CI/CD
cp -R .github_workflow_backup/. .github/workflows/
echo "Workflow ripristinati dalla cartella di backup."
