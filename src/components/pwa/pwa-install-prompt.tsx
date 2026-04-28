"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { Download, X, Monitor, Smartphone, Apple, Chrome, Globe, SmartphoneNfc } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ── Context to share install capability with header button ────
const PwaInstallContext = createContext<{
  canInstall: boolean;
  triggerInstall: () => void;
  isInstalled: boolean;
  openInstallDialog: () => void;
}>({
  canInstall: false,
  triggerInstall: () => {},
  isInstalled: false,
  openInstallDialog: () => {},
});

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}

// ── Auto-dismiss key ──────────────────────────────────────────
const DISMISSED_KEY = "pwa-install-dismissed";
const INSTALLED_KEY = "pwa-installed";

function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as Record<string, BeforeInstallPromptEvent>).__deferredPrompt || null;
}

function setDeferredPrompt(e: BeforeInstallPromptEvent | null) {
  (window as unknown as Record<string, BeforeInstallPromptEvent | null>).__deferredPrompt = e;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as Record<string, boolean>).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/.test(ua.toLowerCase());
}

function detectBrowser(): "chrome" | "edge" | "safari" | "firefox" | "other" {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome/") && !ua.includes("edg/")) return "chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "safari";
  if (ua.includes("firefox/")) return "firefox";
  return "other";
}

// ── Check initial install state (SSR-safe) ────────────────────
function getInitialInstalled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (isStandalone()) return true;
    return localStorage.getItem(INSTALLED_KEY) === "true" && isStandalone();
  } catch { return false; }
}

function getInitialCanInstall(): boolean {
  if (typeof window === "undefined") return false;
  return !!getDeferredPrompt();
}

// ── Main Component ────────────────────────────────────────────
export function PwaInstallPrompt() {
  const [canInstall, setCanInstall] = useState(getInitialCanInstall);
  const [isInstalled] = useState(getInitialInstalled);
  const [showBanner, setShowBanner] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Clear dismissed key if already installed
  useEffect(() => {
    if (isInstalled) {
      sessionStorage.removeItem(DISMISSED_KEY);
    }
  }, [isInstalled]);

  // Listen for the browser's install prompt
  useEffect(() => {
    if (isInstalled) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);

      // Don't show if user previously dismissed
      const dismissed = sessionStorage.getItem(DISMISSED_KEY);
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // App installed event
    const installedHandler = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setCanInstall(false);
      sessionStorage.removeItem(DISMISSED_KEY);
      try { localStorage.setItem(INSTALLED_KEY, "true"); } catch { /* */ }
    };

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [isInstalled]);

  const triggerInstall = useCallback(async () => {
    const prompt = getDeferredPrompt();
    if (!prompt) {
      // No deferred prompt — open dialog with instructions
      setShowDialog(true);
      return;
    }
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
    } catch {
      // Prompt might fail
      setShowDialog(true);
    }
    setDeferredPrompt(null);
    setCanInstall(false);
  }, []);

  const openInstallDialog = useCallback(() => {
    setShowDialog(true);
  }, []);

  const handleDismissBanner = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setTimeout(() => {
      try { sessionStorage.removeItem(DISMISSED_KEY); } catch { /* */ }
    }, 24 * 60 * 60 * 1000);
  }, []);

  return (
    <PwaInstallContext.Provider value={{ canInstall, triggerInstall, isInstalled, openInstallDialog }}>
      {/* Auto-install banner (bottom floating) */}
      <AnimatePresence>
        {showBanner && canInstall && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-xl shadow-black/10 max-w-sm">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Install Chart Studio</p>
                <p className="text-xs text-muted-foreground">
                  Add to home screen for a native app experience
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  onClick={triggerInstall}
                  className="h-8 px-3 text-xs font-semibold rounded-lg"
                >
                  Install
                </Button>
                <button
                  onClick={handleDismissBanner}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install instructions dialog */}
      <InstallDialog open={showDialog} onOpenChange={setShowDialog} />
    </PwaInstallContext.Provider>
  );
}

// ── Install Instructions Dialog ────────────────────────────────
function InstallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const ios = isIOS();
  const browser = detectBrowser();
  const deferred = getDeferredPrompt();

  const handleNativeInstall = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        onOpenChange(false);
      }
    } catch { /* */ }
    setDeferredPrompt(null);
  }, [deferred, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Install Chart Studio
          </DialogTitle>
          <DialogDescription>
            Install this app on your device for quick access and offline support.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Native install button (if available) */}
          {deferred && (
            <>
              <Button onClick={handleNativeInstall} className="w-full h-12 text-base font-semibold gap-2">
                <Download className="h-5 w-5" />
                Install App
              </Button>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  or follow manual steps
                </span>
              </div>
            </>
          )}

          {/* Desktop instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Desktop
            </h4>
            {browser === "chrome" && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Chrome className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-0.5">Google Chrome</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      <li>Click the <strong className="text-foreground">install icon</strong> (⊕) in the address bar</li>
                      <li>Or click <strong className="text-foreground">⋮ menu → &quot;Install Chart Studio&quot;</strong></li>
                      <li>Click <strong className="text-foreground">&quot;Install&quot;</strong> in the confirmation dialog</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
            {browser === "edge" && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-0.5">Microsoft Edge</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      <li>Click the <strong className="text-foreground">install icon</strong> in the address bar</li>
                      <li>Or click <strong className="text-foreground">⋯ menu → &quot;Apps → Install this site&quot;</strong></li>
                      <li>Click <strong className="text-foreground">&quot;Install&quot;</strong></li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
            {browser !== "chrome" && browser !== "edge" && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Any Chromium browser:</strong> Look for the install icon (⊕) in the address bar, or use the browser menu to find &quot;Install&quot; or &quot;Add to Home Screen&quot;.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Mobile instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </h4>

            {/* iOS / Safari */}
            {ios ? (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Apple className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-0.5">iOS / Safari</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      <li>Tap the <strong className="text-foreground">Share button</strong> (square with ↑ arrow)</li>
                      <li>Scroll down and tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong></li>
                      <li>Tap <strong className="text-foreground">&quot;Add&quot;</strong> in the top-right corner</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Android Chrome */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Chrome className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-0.5">Android / Chrome</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-xs">
                        <li>Tap the <strong className="text-foreground">⋮ menu</strong> (three dots)</li>
                        <li>Tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong> or &quot;Install App&quot;</li>
                        <li>Tap <strong className="text-foreground">&quot;Install&quot;</strong></li>
                      </ol>
                    </div>
                  </div>
                </div>
                {/* iOS Safari (for non-iOS users who might share) */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Apple className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-0.5">iPhone / iPad (Safari)</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-xs">
                        <li>Tap the <strong className="text-foreground">Share button</strong> (↑ in a square)</li>
                        <li>Scroll and tap <strong className="text-foreground">&quot;Add to Home Screen&quot;</strong></li>
                        <li>Tap <strong className="text-foreground">&quot;Add&quot;</strong></li>
                      </ol>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Features */}
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <SmartphoneNfc className="h-4 w-4 text-primary" />
              What you&apos;ll get
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Launch from your home screen like a native app
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Works offline with cached data
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Full-screen experience without browser chrome
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Faster loading with background caching
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
