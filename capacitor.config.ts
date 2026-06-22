import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bazaarconepal.app",
  appName: "BazaarCo Nepal",
  webDir: "out",
  server: {
    url: "https://www.bazaarconepal.com",
    errorPath: "index.html",
    cleartext: false,
    allowNavigation: ["bazaarconepal.com", "*.bazaarconepal.com"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#111111",
      overlaysWebView: false,
    },
  },
};

export default config;
