import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "app.netlify.bookutil",
  appName: "Bookutil",
  webDir: "dist",
  server: {
    hostname: "bookutil.netlify.app",
    androidScheme: "https"
  }
};

export default config;
