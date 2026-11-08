@echo off
title CampusStash Private Local Wi-Fi Preview
cd /d "%~dp0"
echo Starting Private Local Preview...
npm run preview:local
pause
