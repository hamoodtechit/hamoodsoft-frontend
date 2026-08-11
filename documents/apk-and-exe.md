
## Command to add android platform
- `npx cap add android`

<!-- ## How to Compile the APK via Terminal
*Note: Capacitor requires Java 21 to compile the Android app.*

### 1. Ensure Java 21 is installed (Ubuntu/Debian)
Run this in your terminal (requires your password):
```bash
sudo apt update && sudo apt install -y openjdk-21-jdk
``` -->

### 2. Build the APK
Once Java 21 is installed, run the following commands to generate a new APK:

```bash
# Tell the terminal where the Android SDK is
export ANDROID_HOME=~/Android/Sdk

# Ensure Java 21 is used
export JAVA_HOME=~/jdk-21.0.2

# Go to the android folder
cd /data/projects/hamoodTechIt/school-frontend/android

# Build the APK
./gradlew assembleDebug
```

Your compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`


## exe :
for generate app, run :
- pnpm run electron:build
