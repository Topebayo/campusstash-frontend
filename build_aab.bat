@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
cd /d "C:\Users\xxxxxxxx\Desktop\campusstash-frontend"
echo [1/3] Building frontend bundle...
call npm run build
echo [2/3] Syncing Capacitor Android assets...
call npx cap sync android
cd /d "C:\Users\xxxxxxxx\Desktop\campusstash-frontend\android"
echo [3/3] Assembling Google Play Release AAB Bundle (force rerun)...
call gradlew.bat bundleRelease --rerun-tasks
if %ERRORLEVEL% EQU 0 (
    copy /y app\build\outputs\bundle\release\app-release.aab "C:\Users\xxxxxxxx\Desktop\CampusStash.aab"
    copy /y app\build\outputs\bundle\release\app-release.aab "C:\Users\xxxxxxxx\Downloads\CampusStash.aab"
    copy /y app\build\outputs\bundle\release\app-release.aab "C:\Users\xxxxxxxx\Desktop\campusstash-frontend\CampusStash.aab"
    echo ===================================================
    echo SUCCESS: Google Play AAB Bundle successfully generated!
    echo ===================================================
) else (
    echo Gradle AAB build failed with code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
