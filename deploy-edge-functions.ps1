# Script per deployare le Edge Functions manualmente
Write-Host "🚀 Deploying Edge Functions to Supabase..."

# Set environment variables per il deployment
$env:SUPABASE_PROJECT_REF = "qjtaqrlpronohgpfdxsi"

Write-Host "📦 Deploying consume-credits function..."
try {
    npx supabase functions deploy consume-credits --project-ref qjtaqrlpronohgpfdxsi
    Write-Host "✅ consume-credits deployed successfully"
} catch {
    Write-Host "❌ Failed to deploy consume-credits: $_"
}

Write-Host "📦 Deploying generate-form-fields function..."
try {
    npx supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi
    Write-Host "✅ generate-form-fields deployed successfully"
} catch {
    Write-Host "❌ Failed to deploy generate-form-fields: $_"
}

Write-Host "🎉 Deployment completed!"