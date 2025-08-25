/**
 * Session utilities for tracking user sessions across the application
 */

/**
 * Generate a unique session ID for view tracking
 * Format: session_[32 character hex string]
 */
export function generateSessionId(): string {
  // Generate 16 random bytes and convert to hex
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `session_${hex}`;
}

/**
 * Get or create a session ID from localStorage
 * Creates a new session ID if one doesn't exist or is invalid
 */
export function getSessionId(): string {
  if (typeof window === "undefined") {
    // Server-side rendering - return a temporary session ID
    return generateSessionId();
  }

  try {
    const existingSessionId = localStorage.getItem("captainsmart_session_id");

    // Validate existing session ID format
    if (existingSessionId && /^session_[a-f0-9]{32}$/.test(existingSessionId)) {
      return existingSessionId;
    }

    // Generate new session ID if none exists or invalid
    const newSessionId = generateSessionId();
    localStorage.setItem("captainsmart_session_id", newSessionId);
    return newSessionId;
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn("localStorage not available, using temporary session ID");
    return generateSessionId();
  }
}

/**
 * Clear the current session ID (useful for testing or logout)
 */
export function clearSessionId(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("captainsmart_session_id");
    } catch (error) {
      console.warn("Failed to clear session ID from localStorage");
    }
  }
}
