@echo off
echo ========================================
echo PostgreSQL to MySQL Data Migration
echo ========================================
echo.

echo 📋 Setting up environment variables...
echo.

REM Set PostgreSQL credentials (modify these as needed)
set PG_HOST=localhost
set PG_PORT=5432
set PG_DB_NAME=waf_database
set PG_USER=postgres
set /p PG_PASSWORD=Enter PostgreSQL password: 

echo.
echo 🎯 Setting up MySQL credentials...
echo.

REM Set MySQL credentials (XAMPP uses empty password for root)
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=waf_database
set DB_USER=root
set DB_PASSWORD=

echo.
echo 🔄 Starting data migration...
echo.

python migrate_data.py

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ Migration completed successfully!
    echo 💡 You can now start the MySQL backend
    echo.
    echo 🚀 Starting MySQL backend...
    set DB_PASSWORD=
    python api.py
) else (
    echo ❌ Migration failed!
    echo 💡 Please check the error messages above
    echo 💡 Make sure both databases are running
)

echo.
pause
