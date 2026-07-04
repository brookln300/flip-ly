@echo off
cd /d "C:\Users\knati\.openclaw\workspace\flip-ly-app"
node scripts\local-comps.mjs >> "%LOCALAPPDATA%\fliply-local-comps.log" 2>&1
