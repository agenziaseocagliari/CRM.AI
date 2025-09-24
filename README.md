#
## Policy gestione CI/CD e automazione

**Policy:** gestire CI/CD e automazioni solo da Codespace/GitHub.dev.
Dopo ogni sync da AI Studio, ripristinare la cartella workflow con lo script `restore-workflow.sh`.
Non modificare/committare file di automazione da AI Studio!

1. La branch dedicata per l'infrastruttura è `ci-infra`.
2. Tutti i file di workflow sono salvati anche in `.github_workflow_backup`.
3. Per ripristinare i workflow dopo un sync AI Studio:
   ```bash
   bash restore-workflow.sh
   git add .github/workflows
   git commit -m "Restore workflows deleted by AI Studio sync"
   git push
   ```
4. In caso di merge/main da AI Studio, risolvere i conflitti scegliendo sempre i workflow dalla branch `ci-infra`.
5. Ottimizzare sicurezza, badge, segreti e impostazioni CI/CD solo da GitHub/codespace e mai da AI Studio.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1UCBcInOTwWOWJKtrq-Wuqj-stk4niOuD

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
