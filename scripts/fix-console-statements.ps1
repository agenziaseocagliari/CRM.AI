# PowerShell script to replace console statements with diagnosticLogger
param(
    [string]$Directory = "C:\Users\inves\CRM-AI\src"
)

Write-Host "Starting console.log replacements in: $Directory"

# Get all TypeScript and TSX files
$files = Get-ChildItem -Path $Directory -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.Name -notmatch "\.d\.ts$" }

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace console.log statements
    $content = $content -replace 'console\.log\(', 'diagnosticLogger.info('
    $content = $content -replace 'console\.error\(', 'diagnosticLogger.error('
    $content = $content -replace 'console\.warn\(', 'diagnosticLogger.warn('
    $content = $content -replace 'console\.debug\(', 'diagnosticLogger.debug('
    $content = $content -replace 'console\.info\(', 'diagnosticLogger.info('
    
    # Count replacements in this file
    $fileReplacements = 0
    if ($content -ne $originalContent) {
        # Count how many console statements were replaced
        $consoleMatches = [regex]::Matches($originalContent, 'console\.(log|error|warn|debug|info)\(')
        $fileReplacements = $consoleMatches.Count
        $totalReplacements += $fileReplacements
        
        # Add import for diagnosticLogger if not present and replacements were made
        if ($content -notmatch "import.*diagnosticLogger.*from.*diagnosticLogger" -and $fileReplacements -gt 0) {
            # Find the last import statement to add after it
            $importRegex = '(?m)^import\s+.*?from\s+[''"].*?[''"];?\s*$'
            $lastImportMatch = [regex]::Matches($content, $importRegex) | Select-Object -Last 1
            
            if ($lastImportMatch) {
                $insertPosition = $lastImportMatch.Index + $lastImportMatch.Length
                $diagnosticImport = "`nimport { diagnosticLogger } from '../lib/diagnosticLogger';"
                
                # Adjust path based on file location
                $relativePath = [System.IO.Path]::GetRelativePath("C:\Users\inves\CRM-AI\src", $file.DirectoryName)
                $pathDepth = ($relativePath -split [regex]::Escape([System.IO.Path]::DirectorySeparatorChar)).Length
                if ($relativePath -eq ".") { $pathDepth = 0 }
                
                $libPath = if ($pathDepth -eq 0) { 
                    "./lib/diagnosticLogger" 
                } else { 
                    "../" * $pathDepth + "lib/diagnosticLogger" 
                }
                
                $diagnosticImport = "`nimport { diagnosticLogger } from '$libPath';"
                $content = $content.Insert($insertPosition, $diagnosticImport)
            }
        }
        
        # Write the modified content back to file
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Replaced $fileReplacements console statements in: $($file.Name)"
    }
}

Write-Host "Total console statements replaced: $totalReplacements"
Write-Host "Console statement replacement completed!"