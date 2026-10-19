<#
.SYNOPSIS
    Akash.Sec Cybersecurity Portfolio - PowerShell Local Launcher
.DESCRIPTION
    Checks port 8080 availability, verifies local Splunk Enterprise service,
    starts the local development server, and opens the portfolio in your browser.
#>

$portfolioDir = $PSScriptRoot
if (-not $portfolioDir) { $portfolioDir = "D:\Website demo" }

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   AKASH.SEC CYBERSECURITY PORTFOLIO - LOCAL LAUNCHER" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Check Splunk Enterprise service status
$splunkService = Get-Service -Name "Splunkd" -ErrorAction SilentlyContinue
if ($splunkService) {
    if ($splunkService.Status -eq "Running") {
        Write-Host "[OK] Splunk Enterprise Service: RUNNING" -ForegroundColor Green
        
        # Verify Web port 8000
        $port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
        if ($port8000) {
            Write-Host "[OK] Splunk Web: Listening on http://localhost:8000" -ForegroundColor Green
        } else {
            Write-Host "[!] Splunkd is running, but port 8000 not yet responding." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[!] Splunk Enterprise Service is STOPPED." -ForegroundColor Yellow
        Write-Host "    To start Splunk: Run 'Start-Service Splunkd' as Administrator." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "[i] Splunkd Windows service not found on this system." -ForegroundColor DarkGray
}

Write-Host "----------------------------------------------------------------" -ForegroundColor DarkCyan

# 2. Check Port 8080 Availability
$port8080 = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "[!] Port 8080 is already in use by process PID $($port8080.OwningProcess)." -ForegroundColor Yellow
    Write-Host "[*] Opening portfolio index.html directly in browser..." -ForegroundColor Cyan
    Start-Process "$portfolioDir\index.html"
    exit 0
}

# 3. Launch with Node.js if available
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    Write-Host "[*] Node.js runtime detected: $($nodePath.Source)" -ForegroundColor Green
    Write-Host "[*] Starting local HTTP server on port 8080..." -ForegroundColor Cyan
    Set-Location -Path $portfolioDir
    node "$portfolioDir\local_server.js"
} else {
    Write-Host "[i] Node.js not detected on PATH. Opening directly in browser..." -ForegroundColor Yellow
    Start-Process "$portfolioDir\index.html"
}
