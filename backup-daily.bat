@echo off
setlocal enabledelayedexpansion

:: Configuration
set "PROJECT_PATH=C:\Users\inves\CRM-AI"
set "BACKUP_BASE=C:\Users\inves\Desktop\CRM-AI_BACKUPS"

:: Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "TIMESTAMP=!datetime:~0,8!_!datetime:~8,6!"
set "BACKUP_PATH=%BACKUP_BASE%\CRM-AI_BACKUP_!TIMESTAMP!"

echo ================================================
echo Guardian AI CRM - Daily Backup Script
echo ================================================
echo.
echo Source: %PROJECT_PATH%
echo Destination: %BACKUP_PATH%
echo Timestamp: !TIMESTAMP!
echo.

:: Create backup directory
echo Creating backup directory...
mkdir "%BACKUP_PATH%" 2>nul

:: Copy files (excluding large folders)
echo Copying files...
xcopy "%PROJECT_PATH%\*" "%BACKUP_PATH%\" /E /I /H /Y /EXCLUDE:backup-exclude.txt

:: Create backup manifest
echo Creating backup manifest...
(
echo Guardian AI CRM - Backup Manifest
echo ==================================
echo Backup Time: %DATE% %TIME%
echo Backup Location: %BACKUP_PATH%
echo Git Commit: 
git -C "%PROJECT_PATH%" rev-parse HEAD
echo Git Branch:
git -C "%PROJECT_PATH%" branch --show-current
echo.
echo Files and folders backed up:
dir "%BACKUP_PATH%" /S /B
) > "%BACKUP_PATH%\BACKUP_MANIFEST.txt"

:: Keep only last 7 backups (delete older)
echo Cleaning old backups (keeping last 7)...
for /f "skip=7 delims=" %%F in ('dir "%BACKUP_BASE%\CRM-AI_BACKUP_*" /b /ad /o-d') do (
    echo Deleting old backup: %%F
    rd /s /q "%BACKUP_BASE%\%%F"
)

echo.
echo ✅ Backup completed successfully!
echo Location: %BACKUP_PATH%
echo.
echo Press any key to continue...
pause > nul