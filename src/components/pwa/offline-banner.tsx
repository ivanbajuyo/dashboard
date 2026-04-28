"use client";

import { useCallback, useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getInitialOnlineStatus() {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(getInitialOnlineStatus);
  const [justCameBackOnline, setJustCameBackOnline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    setJustCameBackOnline(true);
    // Hide the "back online" banner after 3 seconds
    setTimeout(() => setJustCameBackOnline(false), 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setJustCameBackOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return (
    <>
      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium z-[60]">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>You&apos;re offline. Some features may be limited.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back online toast */}
      <AnimatePresence>
        {justCameBackOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl shadow-lg">
              <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Back online
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
