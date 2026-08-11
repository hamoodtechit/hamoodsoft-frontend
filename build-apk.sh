#!/bin/bash
set -e

echo "Setting up Android SDK..."
SDK_DIR="$HOME/Android/Sdk"
mkdir -p "$SDK_DIR/cmdline-tools"

if [ ! -d "$SDK_DIR/cmdline-tools/latest" ]; then
    echo "Downloading cmdline-tools..."
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O "$SDK_DIR/cmdline-tools.zip"
    unzip -q "$SDK_DIR/cmdline-tools.zip" -d "$SDK_DIR/cmdline-tools/"
    mv "$SDK_DIR/cmdline-tools/cmdline-tools" "$SDK_DIR/cmdline-tools/latest"
    rm "$SDK_DIR/cmdline-tools.zip"
fi

echo "Accepting licenses..."
yes | "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1

echo "Installing platforms and build tools..."
"$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-34" "build-tools;34.0.0"

echo "Setting up Java 21..."
JAVA_DIR="$HOME/jdk-21.0.2"
if [ ! -d "$JAVA_DIR" ]; then
    echo "Downloading OpenJDK 21..."
    wget -q https://download.java.net/java/GA/jdk21.0.2/f2283984656d49d69e91c558476027ac/13/GPL/openjdk-21.0.2_linux-x64_bin.tar.gz -O "$HOME/openjdk-21.tar.gz"
    tar -xzf "$HOME/openjdk-21.tar.gz" -C "$HOME"
    rm "$HOME/openjdk-21.tar.gz"
fi

export JAVA_HOME="$JAVA_DIR"
export PATH="$JAVA_HOME/bin:$PATH"

echo "Building APK..."
export ANDROID_HOME="$SDK_DIR"
cd /data/projects/hamoodTechIt/school-frontend/android
./gradlew assembleDebug

echo "APK Build Complete!"
