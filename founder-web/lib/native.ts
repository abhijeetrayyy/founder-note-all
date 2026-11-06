"use client";

/**
 * The Android app is this web app inside a native shell (Capacitor). Almost
 * nothing needs to know — this file holds the few places where a phone app
 * should behave differently from a browser tab.
 */

type CapacitorGlobal = { isNativePlatform?: () => boolean };

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

/**
 * Android's back button, the way people expect it: close what's open first
 * (a sheet, a note), then go back a screen, and from the first screen send
 * the app to the background rather than quitting it.
 *
 * `closeSomething` returns true when it closed something, so back stops there.
 */
export async function setupBackButton(closeSomething: () => boolean) {
  if (!isNative()) return;
  // Imported only inside the native shell; the browser build never loads it.
  const { App } = await import("@capacitor/app");
  await App.addListener("backButton", ({ canGoBack }) => {
    if (closeSomething()) return;
    if (canGoBack && window.location.pathname !== "/") window.history.back();
    else void App.minimizeApp();
  });
}
