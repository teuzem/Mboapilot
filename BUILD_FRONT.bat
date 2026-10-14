@echo off
REM MboaPilot — reconstruit le frontend React (necessite Node.js + internet, une seule fois)
cd /d "%~dp0frontend"
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install --no-audit --no-fund
node node_modules\vite\bin\vite.js build
pause
