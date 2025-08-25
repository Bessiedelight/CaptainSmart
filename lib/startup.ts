import { startCleanupScheduler } from "./utils/cleanupScheduler";

let initialized = false;

export function initializeApp() {
  if (initialized) {
    return;
  }

  console.log("Initializing application services...");

  // Start the cleanup scheduler
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_CLEANUP_SCHEDULER === "true"
  ) {
    startCleanupScheduler();
  } else {
    console.log(
      "Cleanup scheduler disabled in development mode. Set ENABLE_CLEANUP_SCHEDULER=true to enable."
    );
  }

  initialized = true;
  console.log("Application services initialized");
}

// Auto-initialize when this module is imported
if (typeof window === "undefined") {
  // Only run on server side
  initializeApp();
}
