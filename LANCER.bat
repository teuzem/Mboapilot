@echo off
REM MboaPilot — lancement (le frontend React est pre-construit dans frontend\dist)
cd /d "%~dp0"
python -c "import flask, pyotp" 2>nul || pip install -r requirements.txt
python app.py
pause
