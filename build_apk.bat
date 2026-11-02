@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
cd /d "C:\Users\xxxxxxxx\Desktop\campusstash-frontend"
echo [1/3] Building frontend bundle...
call npm run build
echo [2/3] Syncing Capacitor Android assets...
call npx cap sync android
cd /d "C:\Users\xxxxxxxx\Desktop\campusstash-frontend\android"
echo [3/3] Assembling debug APK (force rerun)...
call gradlew.bat assembleDebug --rerun-tasks
if %ERRORLEVEL% EQU 0 (
    copy /y app\build\outputs\apk\debug\app-debug.apk "C:\Users\xxxxxxxx\Desktop\CampusStash-debug.apk"
    copy /y app\build\outputs\apk\debug\app-debug.apk "C:\Users\xxxxxxxx\Desktop\CampusStash.apk"
    copy /y app\build\outputs\apk\debug\app-debug.apk "C:\Users\xxxxxxxx\Downloads\CampusStash-debug.apk"
    copy /y app\build\outputs\apk\debug\app-debug.apk "C:\Users\xxxxxxxx\Desktop\campusstash-frontend\CampusStash-debug.apk"
    echo ===================================================
    echo SUCCESS: Fresh Android APK forced rebuilt and copied!
    echo ===================================================
) else (
    echo Gradle build failed with code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
