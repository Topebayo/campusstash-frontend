@echo off
title CampusStash Live Preview Tunnel
cd /d "%~dp0"
echo Starting CampusStash Preview Tunnel...
npm run preview:tunnel
pause
