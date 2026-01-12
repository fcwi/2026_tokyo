Write-Host "Checking iOS PWA Features..." -ForegroundColor Cyan
Write-Host ""

$files = @("index.html", "manifest.json", "src/index.css", "src/App.css", "src/App.jsx")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK $file" -ForegroundColor Green
    } else {
        Write-Host "  NG $file" -ForegroundColor Red
    }
}

Write-Host ""
$indexContent = Get-Content "index.html" -Raw -ErrorAction SilentlyContinue
if ($indexContent -match "apple-mobile-web-app-capable") {
    Write-Host "  OK apple-mobile-web-app-capable" -ForegroundColor Green
} else {
    Write-Host "  NG apple-mobile-web-app-capable" -ForegroundColor Red
}

if ($indexContent -match "viewport-fit=cover") {
    Write-Host "  OK viewport-fit=cover" -ForegroundColor Green
} else {
    Write-Host "  NG viewport-fit=cover" -ForegroundColor Red
}

Write-Host ""
$cssContent = Get-Content "src/index.css" -Raw -ErrorAction SilentlyContinue
if ($cssContent -match "safe-area-inset") {
    Write-Host "  OK safe-area-inset" -ForegroundColor Green
} else {
    Write-Host "  NG safe-area-inset" -ForegroundColor Red
}

Write-Host ""
$appContent = Get-Content "src/App.jsx" -Raw -ErrorAction SilentlyContinue
if ($appContent -match "showIOSInstallPrompt") {
    Write-Host "  OK iOS Install Prompt" -ForegroundColor Green
} else {
    Write-Host "  NG iOS Install Prompt" -ForegroundColor Red
}

if ($appContent -match "showOrientationWarning") {
    Write-Host "  OK Orientation Warning" -ForegroundColor Green
} else {
    Write-Host "  NG Orientation Warning" -ForegroundColor Red
}

Write-Host ""
Write-Host "All checks complete!" -ForegroundColor Cyan
