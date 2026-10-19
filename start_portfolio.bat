@echo off
setlocal
title Akash.Sec Cybersecurity Portfolio Launcher

echo ================================================================
echo    AKASH.SEC CYBERSECURITY PORTFOLIO - LOCAL LAUNCHER
echo ================================================================
echo.

:: Check whether Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [*] Node.js runtime detected.
    echo [*] Starting local HTTP server on port 8080...
    echo.
    node "%~dp0local_server.js"
) else (
    echo [!] Node.js not detected on PATH.
    echo [*] Opening portfolio directly in default browser via file protocol...
    start "" "%~dp0index.html"
    echo [OK] Portfolio opened: %~dp0index.html
    pause
)
