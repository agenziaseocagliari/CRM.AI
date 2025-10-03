# Fix specific unused variables in scripts by prefixing with underscore
$filesToFix = @{
    "scripts\lint-api-role-usage.ts" = @(
        @{ old = "const colors = {"; new = "const _colors = {" },
        @{ old = "function formatSeverity(severity: string): string {"; new = "function formatSeverity(_severity: string): string {" },
        @{ old = "    files.forEach((file, idx) => {"; new = "    files.forEach((file, _idx) => {" },
        @{ old = "        const relPath = path.relative(process.cwd(), file);"; new = "        const _relPath = path.relative(process.cwd(), file);" },
        @{ old = "    } catch (error) {"; new = "    } catch (_error) {" }
    );
    "scripts\validate-jwt-diagnostics.ts" = @(
        @{ old = "function formatMessage(message: string, color: string = '''''''): string {"; new = "function formatMessage(message: string, _color: string = '''''''): string {" },
        @{ old = "    const decodeJWT = (token: string) => {"; new = "    const _decodeJWT = (token: string) => {" }
    );
    "scripts\verify-jwt-custom-claims.ts" = @(
        @{ old = "function formatMessage(message: string, color: string = '''''''): string {"; new = "function formatMessage(message: string, _color: string = '''''''): string {" },
        @{ old = "    } catch (error) {"; new = "    } catch (_error) {" }
    )
}

foreach ($file in $filesToFix.Keys) {
    if (Test-Path $file) {
        Write-Host "Fixing $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        foreach ($replacement in $filesToFix[$file]) {
            $content = $content -replace [regex]::Escape($replacement.old), $replacement.new
        }
        Set-Content $file $content -Encoding UTF8
    }
}
