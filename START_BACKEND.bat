@echo off
echo ============================================================
echo     DEMARRAGE BACKEND - Gestion Cours Universitaires
echo ============================================================
echo.

cd /d "%~dp0backend"

echo Verification des dependances Python...
echo.

pip show flask >nul 2>&1
if errorlevel 1 (
    echo Installation des dependances en cours...
    echo Cela peut prendre 1-2 minutes...
    echo.
    pip install flask flask-cors flask-sqlalchemy flask-jwt-extended bcrypt psycopg2 python-dotenv python-dateutil
    echo.
    echo ✓ Dependances installees !
    echo.
) else (
    echo ✓ Dependances deja installees
    echo.
)

if not exist ".env" (
    echo.
    echo ⚠️  ATTENTION: Fichier .env manquant !
    echo.
    echo Creation du fichier .env...
    echo DB_NAME=university > .env
    echo DB_PASSWORD=postgres >> .env
    echo FLASK_ENV=development >> .env
    echo FLASK_DEBUG=1 >> .env
    echo SECRET_KEY=dev-secret-key-2024 >> .env
    echo JWT_SECRET_KEY=jwt-secret-key-2024 >> .env
    echo CORS_ORIGINS=* >> .env
    echo SQL_ECHO=False >> .env
    echo.
    echo ⚠️  N'OUBLIEZ PAS de modifier DB_PASSWORD dans backend/.env
    echo    avec votre vrai mot de passe PostgreSQL !
    echo.
    pause
)

echo ============================================================
echo Demarrage du serveur Flask...
echo ============================================================
echo.

python run.py

pause

