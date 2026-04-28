// Service Worker registration for PWA
// This runs in the browser to register the service worker

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) {
    console.warn("[PWA] Service workers are not supported in this browser.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "activated" &&
            navigator.serviceWorker.controller
          ) {
            // New content is available — could show a toast here
            console.log("[PWA] New content available. Refresh to update.");
          }
        });
      });

      console.log("[PWA] Service worker registered successfully.");
    } catch (error) {
      console.warn("[PWA] Service worker registration failed:", error);
    }
  });
}
