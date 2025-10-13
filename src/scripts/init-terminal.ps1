# Anclora Kairon Terminal Initialization Script
# Add this to your PowerShell profile to auto-run on terminal startup

param(
    [string]$ProjectPath = $null
)

# Function to check if we're in a project directory
function Test-ProjectDirectory {
    param([string]$Path = $PWD)

    $packageJson = Join-Path $Path "package.json"
    $puertosMd = Join-Path $Path "PUERTOS.md"

    return (Test-Path $packageJson) -and (Test-Path $puertosMd)
}

# Function to run auto-setup
function Invoke-AutoSetup {
    param([string]$ProjectRoot)

    Write-Host "🚀 Anclora Kairon Auto-Setup" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host ""

    try {
        # Check if Node.js is available
        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
            return
        }

        # Check if we're in the project directory
        if (Test-ProjectDirectory -Path $ProjectRoot) {
            Write-Host "✅ Project structure verified" -ForegroundColor Green

            # Run the setup script
            $setupScript = Join-Path $ProjectRoot "src\scripts\auto-setup.js"
            if (Test-Path $setupScript) {
                Write-Host "🔧 Running development setup..." -ForegroundColor Yellow
                & node $setupScript
            } else {
                Write-Host "⚠️  Setup script not found at: $setupScript" -ForegroundColor Yellow
            }
        } else {
            Write-Host "ℹ️  Not in Anclora Kairon project directory" -ForegroundColor Gray
        }

    } catch {
        Write-Host "❌ Auto-setup failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Manual commands available:" -ForegroundColor Yellow
        Write-Host "   cd 'path\to\anclora-kairon'" -ForegroundColor White
        Write-Host "   npm run setup              # Check environment" -ForegroundColor White
        Write-Host "   npm run dev:landing        # Start landing page" -ForegroundColor White
        Write-Host "   npm run dev:app           # Start main app" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "💡 Quick commands:" -ForegroundColor Cyan
    Write-Host "   npm run dev:landing    # Start landing page (port 5174)" -ForegroundColor White
    Write-Host "   npm run dev:app       # Start main app (port 5175)" -ForegroundColor White
    Write-Host "   npm run check-ports   # Check port status" -ForegroundColor White
    Write-Host "   npm run kill-ports    # Force kill occupied ports" -ForegroundColor White
}

# Main execution
$targetPath = if ($ProjectPath) { $ProjectPath } else { $PWD }

Write-Host "🔍 Checking Anclora Kairon environment..." -ForegroundColor Blue
Invoke-AutoSetup -ProjectRoot $targetPath

Write-Host ""
Write-Host "🎯 Ready for development!" -ForegroundColor Green