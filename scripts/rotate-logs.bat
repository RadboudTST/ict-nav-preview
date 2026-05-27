@echo off
:: RU Nav Editor Log Rotation Script
:: Dit script wordt aangeroepen door de scheduled task voor automatische log rotatie
setlocal enabledelayedexpansion

:: Bepaal paden relatief aan dit script
set "BASEDIR=%~dp0"
set "BASEDIR=%BASEDIR:~0,-1%"
set "NGINXDIR=%BASEDIR%\nginx"
set "LOGDIR=%NGINXDIR%\logs"
set "ARCHIVEDIR=%LOGDIR%\archive"

:: Maak archive folder indien nodig
if not exist "%ARCHIVEDIR%" mkdir "%ARCHIVEDIR%"

:: Datum voor archive bestandsnamen
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set ARCHIVE_DATE=%datetime:~0,8%

:: Log naar event log voor troubleshooting
echo [%date% %time%] RU Nav Editor log rotation gestart >> "%LOGDIR%\rotation.log"

:: Stop nginx via PID file (alleen onze instance)
if exist "%LOGDIR%\nginx.pid" (
    set /p NGINX_PID=<"%LOGDIR%\nginx.pid"
    taskkill /f /pid !NGINX_PID! >nul 2>&1
    echo [%date% %time%] Nginx gestopt (PID: !NGINX_PID!) >> "%LOGDIR%\rotation.log"
    ping 127.0.0.1 -n 2 >nul
) else (
    echo [%date% %time%] Geen nginx.pid gevonden, probeer graceful stop >> "%LOGDIR%\rotation.log"
    pushd "%NGINXDIR%"
    nginx.exe -s stop >nul 2>&1
    popd
    ping 127.0.0.1 -n 2 >nul
)

:: Roteer access.log
if exist "%LOGDIR%\access.log" (
    move "%LOGDIR%\access.log" "%ARCHIVEDIR%\access-%ARCHIVE_DATE%.log" >nul 2>&1
    echo [%date% %time%] access.log gearchiveerd >> "%LOGDIR%\rotation.log"
)

:: Roteer error.log
if exist "%LOGDIR%\error.log" (
    move "%LOGDIR%\error.log" "%ARCHIVEDIR%\error-%ARCHIVE_DATE%.log" >nul 2>&1
    echo [%date% %time%] error.log gearchiveerd >> "%LOGDIR%\rotation.log"
)

:: Opruimen oude archives (bewaar 4 weken)
set count=0
for /f "delims=" %%A in ('dir /b /o-d "%ARCHIVEDIR%\access-*.log" 2^>nul') do (
    set /a count+=1
    if !count! gtr 4 (
        del "%ARCHIVEDIR%\%%A" >nul 2>&1
        echo [%date% %time%] Oude archive verwijderd: %%A >> "%LOGDIR%\rotation.log"
    )
)
set count=0
for /f "delims=" %%A in ('dir /b /o-d "%ARCHIVEDIR%\error-*.log" 2^>nul') do (
    set /a count+=1
    if !count! gtr 4 (
        del "%ARCHIVEDIR%\%%A" >nul 2>&1
        echo [%date% %time%] Oude archive verwijderd: %%A >> "%LOGDIR%\rotation.log"
    )
)

:: Start nginx opnieuw
pushd "%NGINXDIR%"
start "" "nginx.exe"
popd
ping 127.0.0.1 -n 2 >nul

:: Verifieer dat nginx draait
tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if !errorlevel! equ 0 (
    echo [%date% %time%] Nginx herstart - log rotation voltooid >> "%LOGDIR%\rotation.log"
) else (
    echo [%date% %time%] FOUT: Nginx niet herstart! >> "%LOGDIR%\rotation.log"
)

:: Houd rotation.log zelf ook beperkt (laatste 100 regels)
if exist "%LOGDIR%\rotation.log" (
    for %%A in ("%LOGDIR%\rotation.log") do (
        if %%~zA gtr 50000 (
            powershell -Command "Get-Content '%LOGDIR%\rotation.log' -Tail 100 | Set-Content '%LOGDIR%\rotation-temp.log'"
            move /y "%LOGDIR%\rotation-temp.log" "%LOGDIR%\rotation.log" >nul 2>&1
        )
    )
)

endlocal
exit /b 0
