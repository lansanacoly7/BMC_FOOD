@echo off
title BMC FOOD - Demarrage Global des Services
echo ========================================================
echo   BMC FOOD DAKAR - LANCEMENT DES 3 SERVICES
echo ========================================================
echo.
echo [1/3] Demarrage du Backend Django REST API (Port 8000)...
start "BMC Backend (Port 8000)" cmd /k "cd backend && python manage.py runserver"

echo [2/3] Demarrage du Site Client BMC Food (Port 5173)...
start "BMC Client Website (Port 5173)" cmd /k "cd client_website && npm run dev"

echo [3/3] Demarrage de l'Application Admin Cuisine (Port 5174)...
start "BMC Admin App (Port 5174)" cmd /k "cd admin_app && npm run dev"

echo.
echo Tous les services sont lances !
echo - Site Client        : http://localhost:5173/
echo - Application Admin  : http://localhost:5174/
echo - API Backend & Docs : http://127.0.0.1:8000/api/docs/
echo ========================================================
pause
