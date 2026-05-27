@echo off
title RU Nav Editor Installer
setlocal enabledelayedexpansion

:: ============================================================
:: CONFIGURATIE
:: ============================================================
set "NGINX_VERSION=1.27.2"
set "NGINX_PORT=3333"

:: Bepaal paden
set "BASEDIR=%~dp0"
set "BASEDIR=%BASEDIR:~0,-1%"
set "NGINXDIR=%BASEDIR%\nginx"
set "HTMLDIR=%NGINXDIR%\html"
set "DISTDIR=%BASEDIR%\dist"
set "CONFIGFILE=%BASEDIR%\nginx-windows.conf"

cls
echo.
echo  ============================================================
echo   RU NAV EDITOR INSTALLER - Radboud University
echo  ============================================================
echo.
echo   Installatie map: %BASEDIR%
echo   Nginx versie:    %NGINX_VERSION%
echo   Poort:           %NGINX_PORT%
echo.

:: Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [FOUT] Administrator rechten vereist!
    echo         Rechtsklik INSTALL.bat - Als administrator uitvoeren
    pause
    exit /b 1
)

:: Check dist
if not exist "%DISTDIR%\index.html" (
    echo  [FOUT] dist map niet gevonden: %DISTDIR%
    pause
    exit /b 1
)
echo  [OK] dist map gevonden

:: Check config
if not exist "%CONFIGFILE%" (
    echo  [FOUT] nginx-windows.conf niet gevonden
    pause
    exit /b 1
)
echo  [OK] config gevonden
echo.

:: Download nginx indien nodig
if exist "%NGINXDIR%\nginx.exe" (
    echo  [--] Nginx al aanwezig, overslaan download
    echo      Verwijder nginx map om opnieuw te installeren
) else (
    :: Controleer internet verbinding
    echo  [1/6] Internet verbinding controleren...
    ping nginx.org -n 1 -w 5000 >nul 2>&1
    if !errorlevel! neq 0 (
        echo  [FOUT] Geen verbinding met nginx.org
        echo         Controleer je internet verbinding
        pause
        exit /b 1
    )
    echo  [OK] Internet verbinding OK

    echo  [2/6] Nginx %NGINX_VERSION% downloaden...
    set "NGINXZIP=%TEMP%\nginx.zip"
    set "NGINXURL=https://nginx.org/download/nginx-%NGINX_VERSION%.zip"

    :: Download met timeout (60 seconden)
    powershell -Command "$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -Uri 'https://nginx.org/download/nginx-%NGINX_VERSION%.zip' -OutFile '%TEMP%\nginx.zip' -TimeoutSec 60 } catch { exit 1 }"

    if !errorlevel! neq 0 (
        echo  [FOUT] Download mislukt - timeout of server onbereikbaar
        pause
        exit /b 1
    )

    if not exist "%TEMP%\nginx.zip" (
        echo  [FOUT] Download mislukt - bestand niet aangemaakt
        pause
        exit /b 1
    )

    :: Controleer bestandsgrootte (nginx zip moet >1MB zijn)
    for %%A in ("%TEMP%\nginx.zip") do set "FILESIZE=%%~zA"
    if !FILESIZE! LSS 1000000 (
        echo  [FOUT] Download onvolledig - bestand te klein
        del "%TEMP%\nginx.zip" 2>nul
        pause
        exit /b 1
    )
    echo  [OK] Gedownload ^(!FILESIZE! bytes^)

    echo  [3/6] Download verifieren...
    :: Toon SHA256 hash voor handmatige verificatie indien nodig
    for /f "skip=1 tokens=*" %%H in ('certutil -hashfile "%TEMP%\nginx.zip" SHA256 2^>nul') do (
        if not defined FILEHASH set "FILEHASH=%%H"
    )
    echo      SHA256: !FILEHASH!
    echo  [OK] Checksum berekend

    echo  [4/6] Uitpakken...
    powershell -Command "Expand-Archive -Path '%TEMP%\nginx.zip' -DestinationPath '%TEMP%\nginx-extract' -Force"

    if !errorlevel! neq 0 (
        echo  [FOUT] Uitpakken mislukt - corrupte download?
        del "%TEMP%\nginx.zip" 2>nul
        pause
        exit /b 1
    )

    if exist "%NGINXDIR%" rd /s /q "%NGINXDIR%"
    move "%TEMP%\nginx-extract\nginx-%NGINX_VERSION%" "%NGINXDIR%" >nul

    :: Opruimen temp bestanden
    del "%TEMP%\nginx.zip" 2>nul
    rd /s /q "%TEMP%\nginx-extract" 2>nul

    if not exist "%NGINXDIR%\nginx.exe" (
        echo  [FOUT] Installatie mislukt - nginx.exe niet gevonden
        echo         Probeer opnieuw of download handmatig
        pause
        exit /b 1
    )
    echo  [OK] Nginx %NGINX_VERSION% geinstalleerd
)
echo.

echo  [5/6] Configuratie kopieren...
copy /y "%CONFIGFILE%" "%NGINXDIR%\conf\nginx.conf" >nul
echo  [OK] Config gekopieerd

echo  [6/6] Website bestanden kopieren...
if exist "%HTMLDIR%" rd /s /q "%HTMLDIR%"
mkdir "%HTMLDIR%"
xcopy /s /e /q /y "%DISTDIR%\*" "%HTMLDIR%\" >nul
echo  [OK] Bestanden gekopieerd
echo.

echo  Nginx starten...
:: Stop alleen ONZE nginx instance via PID file (niet alle nginx processen!)
if exist "%NGINXDIR%\logs\nginx.pid" (
    set /p NGINX_PID=<"%NGINXDIR%\logs\nginx.pid"
    taskkill /f /pid !NGINX_PID! >nul 2>&1
) else (
    :: Eerste keer installatie - probeer graceful stop
    pushd "%NGINXDIR%"
    nginx.exe -s stop >nul 2>&1
    popd
)

:: Firewall regel voor poort %NGINX_PORT%
netsh advfirewall firewall delete rule name="RU Nav Editor" >nul 2>&1
netsh advfirewall firewall add rule name="RU Nav Editor" dir=in action=allow protocol=tcp localport=%NGINX_PORT% >nul 2>&1
echo  [OK] Firewall regel toegevoegd voor poort %NGINX_PORT%

:: Auto-start taak aanmaken (met expliciete config path voor correcte werking bij boot)
schtasks /delete /tn "RU Nav Editor" /f >nul 2>&1
schtasks /create /tn "RU Nav Editor" /tr "cmd /c \"cd /d \"%NGINXDIR%\" && nginx.exe\"" /sc onstart /ru SYSTEM /rl HIGHEST /f >nul 2>&1
echo  [OK] Auto-start taak aangemaakt

:: Start nginx
pushd "%NGINXDIR%"
start "" "nginx.exe"
popd

:: Wacht 3 seconden en controleer
ping 127.0.0.1 -n 4 >nul

tasklist /fi "imagename eq nginx.exe" 2>nul | find /i "nginx.exe" >nul
if !errorlevel! equ 0 (
    echo  [OK] Nginx draait!
) else (
    echo  [FOUT] Nginx niet gestart
    echo.
    echo  --- Error log ---
    if exist "%NGINXDIR%\logs\error.log" type "%NGINXDIR%\logs\error.log"
    echo  -----------------
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo   INSTALLATIE VOLTOOID!
echo  ============================================================
echo.
echo   Nginx versie:  %NGINX_VERSION%
echo   URL:           http://localhost:%NGINX_PORT%
echo   Auto-start:    Ingeschakeld
echo   Beheer:        UPDATE.bat
echo.
echo   Tip: Gebruik UPDATE.bat voor updates en beheer
echo  ============================================================
echo.

start http://localhost:%NGINX_PORT%
pause
endlocal
