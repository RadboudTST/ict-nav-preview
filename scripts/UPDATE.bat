@echo off
title RU Nav Editor Beheer
setlocal enabledelayedexpansion

:: ============================================================
:: CONFIGURATIE
:: ============================================================
set "NGINX_PORT=3333"

:: Bepaal paden relatief aan dit script
set "BASEDIR=%~dp0"
set "BASEDIR=%BASEDIR:~0,-1%"
set "NGINXDIR=%BASEDIR%\nginx"
set "HTMLDIR=%NGINXDIR%\html"
set "BACKUPDIR=%NGINXDIR%\html-backup"
set "DISTDIR=%BASEDIR%\dist"

:: Check admin rechten
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [FOUT] Administrator rechten vereist!
    echo         Rechtsklik UPDATE.bat - Als administrator uitvoeren
    echo.
    pause
    exit /b 1
)

:menu
cls
echo.
echo  ============================================================
echo   RU NAV EDITOR BEHEER - Radboud University
echo  ============================================================
echo.
echo   Nginx: %NGINXDIR%
echo.

:: Check nginx status
tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if !errorlevel! equ 0 (
    echo   Status: [DRAAIT] http://localhost:%NGINX_PORT%
) else (
    echo   Status: [GESTOPT]
)

:: Check backup status
if exist "%BACKUPDIR%\index.html" (
    echo   Backup: [BESCHIKBAAR]
) else (
    echo   Backup: [GEEN]
)

echo.
echo  ------------------------------------------------------------
echo   [1] Update    [2] Start    [3] Stop      [4] Herstart
echo   [5] Logs      [6] Status   [7] Rollback  [8] Firewall
echo   [9] Log Rotatie
echo   [0] Afsluiten
echo  ------------------------------------------------------------
echo.
set /p K="  Keuze: "

if "%K%"=="1" goto update
if "%K%"=="2" goto start
if "%K%"=="3" goto stop
if "%K%"=="4" goto herstart
if "%K%"=="5" goto logs
if "%K%"=="6" goto status
if "%K%"=="7" goto rollback
if "%K%"=="8" goto firewall
if "%K%"=="9" goto logrotate
if "%K%"=="0" goto exit
goto menu

:update
cls
echo.
echo  === UPDATE ===
echo.

if not exist "%DISTDIR%\index.html" (
    echo  [FOUT] %DISTDIR% niet gevonden!
    echo         Kopieer eerst de nieuwe dist map naar deze locatie.
    pause
    goto menu
)

echo  [1/6] Nginx stoppen...
:: Stop alleen ONZE nginx instance via PID file (niet alle nginx processen!)
if exist "%NGINXDIR%\logs\nginx.pid" (
    set /p NGINX_PID=<"%NGINXDIR%\logs\nginx.pid"
    taskkill /f /pid !NGINX_PID! >nul 2>&1
) else (
    pushd "%NGINXDIR%"
    nginx.exe -s stop >nul 2>&1
    popd
)
ping 127.0.0.1 -n 2 >nul
echo  [OK] Nginx gestopt

echo  [2/6] Nginx configuratie updaten...
set "CONFIGFILE=%BASEDIR%\nginx-windows.conf"
if exist "%CONFIGFILE%" (
    copy /y "%CONFIGFILE%" "%NGINXDIR%\conf\nginx.conf" >nul
    if !errorlevel! equ 0 (
        echo  [OK] Config gekopieerd
    ) else (
        echo  [WARN] Config kopieren mislukt
    )
) else (
    echo  [--] nginx-windows.conf niet gevonden, config overgeslagen
)

echo  [3/6] Backup maken van huidige versie...
if exist "%BACKUPDIR%" rd /s /q "%BACKUPDIR%"
if exist "%HTMLDIR%\index.html" (
    xcopy /s /e /q /y "%HTMLDIR%\*" "%BACKUPDIR%\" >nul
    if !errorlevel! equ 0 (
        echo  [OK] Backup gemaakt in html-backup
    ) else (
        echo  [WARN] Backup mislukt, doorgaan zonder backup
    )
) else (
    echo  [--] Geen bestaande versie om te backuppen
)

echo  [4/6] HTML map legen...
if exist "%HTMLDIR%" (
    del /q "%HTMLDIR%\*" 2>nul
    for /d %%x in ("%HTMLDIR%\*") do rd /s /q "%%x" 2>nul
)
if not exist "%HTMLDIR%" mkdir "%HTMLDIR%"
echo  [OK] Map geleegd

echo  [5/6] Nieuwe bestanden kopieren...
xcopy /s /e /q /y "%DISTDIR%\*" "%HTMLDIR%\" >nul
if !errorlevel! neq 0 (
    echo  [FOUT] Kopieren mislukt!
    echo         Probeer rollback met optie [7]
    pause
    goto menu
)

:: Tel bestanden om te verifieren
for /f %%A in ('dir /b /a-d "%HTMLDIR%" 2^>nul ^| find /c /v ""') do set "FILECOUNT=%%A"
echo  [OK] !FILECOUNT! bestanden gekopieerd

echo  [6/6] Nginx starten...
pushd "%NGINXDIR%"
start "" "nginx.exe"
popd
ping 127.0.0.1 -n 3 >nul

tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if !errorlevel! equ 0 (
    echo.
    echo  ============================================================
    echo  [OK] Update voltooid!
    echo.
    echo   URL: http://localhost:%NGINX_PORT%
    echo   Backup beschikbaar voor rollback indien nodig
    echo  ============================================================
) else (
    echo  [FOUT] Nginx niet gestart
    echo         Controleer logs met optie [5]
)
echo.
pause
goto menu

:start
cls
echo.
echo  === START ===
echo.
pushd "%NGINXDIR%"
start "" "nginx.exe"
popd
ping 127.0.0.1 -n 3 >nul
tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if !errorlevel! equ 0 (
    echo  [OK] Gestart! http://localhost:%NGINX_PORT%
) else (
    echo  [FOUT] Niet gestart - controleer logs
)
pause
goto menu

:stop
cls
echo.
echo  === STOP ===
echo.
:: Stop alleen ONZE nginx instance via PID file
if exist "%NGINXDIR%\logs\nginx.pid" (
    set /p NGINX_PID=<"%NGINXDIR%\logs\nginx.pid"
    taskkill /f /pid !NGINX_PID! >nul 2>&1
) else (
    pushd "%NGINXDIR%"
    nginx.exe -s stop >nul 2>&1
    popd
)
echo  [OK] Gestopt
pause
goto menu

:herstart
cls
echo.
echo  === HERSTART ===
echo.
:: Stop alleen ONZE nginx instance via PID file
if exist "%NGINXDIR%\logs\nginx.pid" (
    set /p NGINX_PID=<"%NGINXDIR%\logs\nginx.pid"
    taskkill /f /pid !NGINX_PID! >nul 2>&1
) else (
    pushd "%NGINXDIR%"
    nginx.exe -s stop >nul 2>&1
    popd
)
ping 127.0.0.1 -n 2 >nul
pushd "%NGINXDIR%"
start "" "nginx.exe"
popd
ping 127.0.0.1 -n 3 >nul
tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if !errorlevel! equ 0 (
    echo  [OK] Herstart! http://localhost:%NGINX_PORT%
) else (
    echo  [FOUT] Niet gestart - controleer logs
)
pause
goto menu

:logs
cls
echo.
echo  === LOGS (laatste 50 regels) ===
echo.
if exist "%NGINXDIR%\logs\error.log" (
    powershell -Command "Get-Content '%NGINXDIR%\logs\error.log' -Tail 50"
) else (
    echo  Geen error.log gevonden
)
echo.
echo  ------------------------------------------------------------
echo  Volledige logs: %NGINXDIR%\logs\
echo  ------------------------------------------------------------
echo.
pause
goto menu

:status
cls
echo.
echo  === STATUS ===
echo.
echo  --- Nginx Proces ---
tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe"
if !errorlevel! neq 0 (
    echo  Nginx is niet actief
)
echo.
echo  --- Nginx Versie ---
pushd "%NGINXDIR%"
nginx.exe -v 2>&1
echo.
echo  --- Config Test ---
nginx.exe -t 2>&1
popd
echo.
echo  --- Paden ---
echo   Base:   %BASEDIR%
echo   Nginx:  %NGINXDIR%
echo   HTML:   %HTMLDIR%
echo   Backup: %BACKUPDIR%
echo   Dist:   %DISTDIR%
echo   Poort:  %NGINX_PORT%
echo.
pause
goto menu

:rollback
cls
echo.
echo  === ROLLBACK ===
echo.

if not exist "%BACKUPDIR%\index.html" (
    echo  [FOUT] Geen backup beschikbaar!
    echo         Voer eerst een update uit om een backup te maken.
    pause
    goto menu
)

echo  Dit herstelt de vorige versie vanuit de backup.
echo.
set /p CONFIRM="  Doorgaan? (j/n): "
if /i not "%CONFIRM%"=="j" (
    echo  Geannuleerd.
    pause
    goto menu
)

echo.
echo  [1/4] Nginx stoppen...
:: Stop alleen ONZE nginx instance via PID file
if exist "%NGINXDIR%\logs\nginx.pid" (
    set /p NGINX_PID=<"%NGINXDIR%\logs\nginx.pid"
    taskkill /f /pid !NGINX_PID! >nul 2>&1
) else (
    pushd "%NGINXDIR%"
    nginx.exe -s stop >nul 2>&1
    popd
)
ping 127.0.0.1 -n 2 >nul
echo  [OK] Gestopt

echo  [2/4] Huidige versie verwijderen...
if exist "%HTMLDIR%" (
    del /q "%HTMLDIR%\*" 2>nul
    for /d %%x in ("%HTMLDIR%\*") do rd /s /q "%%x" 2>nul
)
echo  [OK] Verwijderd

echo  [3/4] Backup terugzetten...
xcopy /s /e /q /y "%BACKUPDIR%\*" "%HTMLDIR%\" >nul
if !errorlevel! neq 0 (
    echo  [FOUT] Rollback mislukt!
    pause
    goto menu
)
echo  [OK] Backup teruggezet

echo  [4/4] Nginx starten...
pushd "%NGINXDIR%"
start "" "nginx.exe"
popd
ping 127.0.0.1 -n 3 >nul

tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if !errorlevel! equ 0 (
    echo.
    echo  ============================================================
    echo  [OK] Rollback voltooid!
    echo.
    echo   URL: http://localhost:%NGINX_PORT%
    echo   Vorige versie is hersteld
    echo  ============================================================
) else (
    echo  [FOUT] Nginx niet gestart - controleer logs
)
echo.
pause
goto menu

:firewall
cls
echo.
echo  === FIREWALL BEHEER ===
echo.

:: Check huidige firewall status
set "FW_3333=0"

netsh advfirewall firewall show rule name="RU Nav Editor" >nul 2>&1
if !errorlevel! equ 0 set "FW_3333=1"

echo  Huidige firewall regels:
echo.
if "!FW_3333!"=="1" (
    echo   [OK] Poort %NGINX_PORT% - RU Nav Editor
) else (
    echo   [--] Poort %NGINX_PORT% - NIET geconfigureerd
)
echo.
echo  ------------------------------------------------------------
echo   [1] Poort %NGINX_PORT% toevoegen
echo   [2] Poort %NGINX_PORT% verwijderen
echo   [0] Terug naar menu
echo  ------------------------------------------------------------
echo.
set /p FW="  Keuze: "

if "%FW%"=="1" (
    netsh advfirewall firewall delete rule name="RU Nav Editor" >nul 2>&1
    netsh advfirewall firewall add rule name="RU Nav Editor" dir=in action=allow protocol=tcp localport=%NGINX_PORT% >nul 2>&1
    echo  [OK] Firewall regel voor poort %NGINX_PORT% toegevoegd
    pause
    goto firewall
)
if "%FW%"=="2" (
    netsh advfirewall firewall delete rule name="RU Nav Editor" >nul 2>&1
    echo  [OK] Firewall regel voor poort %NGINX_PORT% verwijderd
    pause
    goto firewall
)
if "%FW%"=="0" goto menu
goto firewall

:logrotate
cls
echo.
echo  === LOG ROTATIE ===
echo.

:: Show current log sizes
echo  Huidige log groottes:
echo.
if exist "%NGINXDIR%\logs\access.log" (
    for %%F in ("%NGINXDIR%\logs\access.log") do (
        set /a SIZE_MB=%%~zF / 1048576
        echo   access.log: %%~zF bytes ^(!SIZE_MB! MB^)
    )
) else (
    echo   access.log: niet gevonden
)
if exist "%NGINXDIR%\logs\error.log" (
    for %%F in ("%NGINXDIR%\logs\error.log") do (
        set /a SIZE_MB=%%~zF / 1048576
        echo   error.log:  %%~zF bytes ^(!SIZE_MB! MB^)
    )
) else (
    echo   error.log: niet gevonden
)

:: Show archives
echo.
if exist "%NGINXDIR%\logs\archive\" (
    echo  Bestaande archives:
    dir /b "%NGINXDIR%\logs\archive\*.log" 2>nul || echo   [geen archives]
) else (
    echo  Geen archive folder gevonden
)

echo.
echo  ------------------------------------------------------------
echo   [1] Nu roteren   - Logs nu archiveren en nginx herstarten
echo   [2] Scheduled Task instellen - Wekelijks automatisch
echo   [3] Task verwijderen
echo   [0] Terug naar menu
echo  ------------------------------------------------------------
echo.
set /p LR="  Keuze: "

if "%LR%"=="1" (
    echo.
    echo  Logs roteren...

    :: Create archive dir
    if not exist "%NGINXDIR%\logs\archive" mkdir "%NGINXDIR%\logs\archive"

    :: Get date for archive name
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
    set ARCHIVE_DATE=!datetime:~0,8!

    :: Stop nginx - alleen ONZE instance via PID file
    echo  [1/4] Nginx stoppen...
    if exist "%NGINXDIR%\logs\nginx.pid" (
        set /p NGINX_PID=<"%NGINXDIR%\logs\nginx.pid"
        taskkill /f /pid !NGINX_PID! >nul 2>&1
    ) else (
        pushd "%NGINXDIR%"
        nginx.exe -s stop >nul 2>&1
        popd
    )
    ping 127.0.0.1 -n 2 >nul

    :: Rotate logs
    echo  [2/4] Logs archiveren...
    if exist "%NGINXDIR%\logs\access.log" (
        move "%NGINXDIR%\logs\access.log" "%NGINXDIR%\logs\archive\access-!ARCHIVE_DATE!.log" >nul
        echo        access.log -^> archive/access-!ARCHIVE_DATE!.log
    )
    if exist "%NGINXDIR%\logs\error.log" (
        move "%NGINXDIR%\logs\error.log" "%NGINXDIR%\logs\archive\error-!ARCHIVE_DATE!.log" >nul
        echo        error.log -^> archive/error-!ARCHIVE_DATE!.log
    )

    :: Clean old archives (keep 4)
    echo  [3/4] Oude archives opruimen...
    set count=0
    for /f "delims=" %%A in ('dir /b /o-d "%NGINXDIR%\logs\archive\access-*.log" 2^>nul') do (
        set /a count+=1
        if !count! gtr 4 (
            del "%NGINXDIR%\logs\archive\%%A"
            echo        Verwijderd: %%A
        )
    )
    set count=0
    for /f "delims=" %%A in ('dir /b /o-d "%NGINXDIR%\logs\archive\error-*.log" 2^>nul') do (
        set /a count+=1
        if !count! gtr 4 (
            del "%NGINXDIR%\logs\archive\%%A"
            echo        Verwijderd: %%A
        )
    )

    :: Start nginx
    echo  [4/4] Nginx herstarten...
    pushd "%NGINXDIR%"
    start "" "nginx.exe"
    popd
    ping 127.0.0.1 -n 2 >nul

    echo.
    echo  [OK] Log rotatie voltooid!
    pause
    goto logrotate
)

if "%LR%"=="2" (
    echo.
    echo  Scheduled Task aanmaken voor wekelijkse log rotatie...

    :: Create the scheduled task to run rotate-logs.bat every Sunday at 3 AM
    schtasks /create /tn "RU Nav Editor Log Rotation" /tr "\"%BASEDIR%\rotate-logs.bat\"" /sc weekly /d SUN /st 03:00 /ru SYSTEM /f >nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK] Scheduled Task aangemaakt
        echo      Naam: RU Nav Editor Log Rotation
        echo      Schema: Elke zondag om 03:00
        echo.
        schtasks /query /tn "RU Nav Editor Log Rotation" /fo list | findstr /i "TaskName Status"
    ) else (
        echo  [FOUT] Kon scheduled task niet aanmaken
        echo        Probeer handmatig via Task Scheduler
    )
    pause
    goto logrotate
)

if "%LR%"=="3" (
    echo.
    schtasks /delete /tn "RU Nav Editor Log Rotation" /f >nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK] Scheduled Task verwijderd
    ) else (
        echo  [--] Geen scheduled task gevonden om te verwijderen
    )
    pause
    goto logrotate
)

if "%LR%"=="0" goto menu
goto logrotate

:exit
endlocal
exit /b 0
