@echo off
title Z-Truss Dev Server
echo ========================================================
echo   Starting Z-Truss Interactive Structural Analyzer
echo ========================================================
echo.
echo Launching your browser to http://localhost:5173/ ...
start http://localhost:5173/
echo.
echo Running Vite dev server. Keep this window open while using Z-Truss.
echo Press Ctrl+C to stop.
echo.
call npm run dev
