export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Validation
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  // Validate required environment variables
  validate() {
    if (!this.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
  },
};

// Validate on import in production
if (env.isProduction) {
  env.validate();
}
