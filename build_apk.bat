@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
cd /d "C:\Users\xxxxxxxx\Desktop\campusstash-frontend\android"
call gradlew.bat assembleDebug
if %ERRORLEVEL% EQU 0 (
    copy /y app\build\outputs\apk\debug\app-debug.apk "C:\Users\xxxxxxxx\Desktop\CampusStash-debug.apk"
    echo APK build and copy succeeded!
) else (
    echo Gradle build failed with code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

