import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.school.management',
  appName: 'School Management',
  // Next.js uses public as static directory, but Capacitor webDir is mostly for static export. 
  // Since we are pointing to a live URL, webDir is ignored, but required by Capacitor.
  webDir: 'public',
  server: {
    // 💡 IMPORTANT: 
    // To test locally on a physical Android phone, change this URL to your PC's IP address (e.g., http://192.168.1.5:3000)
    // To publish the final app, change this to your production domain (e.g., https://myschoolapp.com)
    url: 'https://test.patwaryinstitute.com', // Note: 10.0.2.2 is the localhost alias for the Android Emulator
    cleartext: true // Required to allow http:// connections
  }
};

export default config;

