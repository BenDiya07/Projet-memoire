@echo off
echo ============================================
echo LISTE DES TABLES - Base university
echo ============================================
echo.
echo Connectez-vous avec votre mot de passe PostgreSQL...
echo.

"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d university -c "\dt"
echo.
echo Appuyez sur une touche pour voir les vues SQL...
pause > nul
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d university -c "\dv"
echo.
pause

