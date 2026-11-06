import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Android app is this same web app, bundled into the APK from its static
 * export. It opens with no network, keeps its data on the phone,
 * and syncs through Supabase exactly like the browser version.
 *
 * Build: `npm run android:apk` — see SETUP.md.
 */
const config: CapacitorConfig = {
  appId: "com.founderos.app",
  appName: "FounderOS",
  // `npm run android:sync` exports the site here (a separate folder from the
  // dev server's .next, so both can run at once).
  webDir: ".next-android",
  android: {
    // The app is light/dark aware; let the WebView paint the background.
    backgroundColor: "#EAEDF1",
  },
  plugins: {
    SystemBars: {
      // The layout already pads with env(safe-area-inset-*) and the page asks
      // for viewport-fit=cover, so say so up front and avoid a layout jump.
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;
