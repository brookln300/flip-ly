@echo off
cd /d "C:\Users\knati\.openclaw\workspace\flip-ly-app"
node scripts\local-enrich.mjs >> "%LOCALAPPDATA%\fliply-local-enrich.log" 2>&1
