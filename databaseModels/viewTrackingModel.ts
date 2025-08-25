import { Schema, model, models, Document } from "mongoose";
import crypto from "crypto";

export interface IViewTracking extends Document {
  exposeId: string;
  sessionId: string;
  ipHash: string;
  userAgent: string;
  viewedAt: Date;
}

const ViewTrackingSchema = new Schema<IViewTracking>(
  {
    exposeId: {
      type: String,
      required: true,
      ref: "Expose",
      validate: {
        validator: function (exposeId: string) {
          return exposeId && exposeId.startsWith("expose_");
        },
        message: "Invalid expose ID format",
      },
    },
    sessionId: {
      type: String,
      required: true,
      validate: {
        validator: function (sessionId: string) {
          // Ensure session ID follows expected format
          return /^session_[a-f0-9]{32}$/.test(sessionId);
        },
        message: "Invalid session ID format",
      },
    },
    ipHash: {
      type: String,
      required: true,
      validate: {
        validator: function (ipHash: string) {
          // Ensure IP hash is a valid SHA-256 hash
          return /^[a-f0-9]{64}$/.test(ipHash);
        },
        message: "Invalid IP hash format",
      },
    },
    userAgent: {
      type: String,
      required: true,
      maxlength: 500,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "viewTracking",
  }
);

// Indexes for optimal query performance and duplicate prevention
ViewTrackingSchema.index({ exposeId: 1 }); // For counting views per expose
ViewTrackingSchema.index({ sessionId: 1, exposeId: 1 }, { unique: true }); // Prevent duplicate views from same session
ViewTrackingSchema.index({ ipHash: 1, exposeId: 1 }); // For IP-based analytics
ViewTrackingSchema.index({ viewedAt: 1 }); // For time-based queries

// TTL index to automatically delete old view records after 30 days
ViewTrackingSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Static methods for the model
ViewTrackingSchema.statics.generateSessionId = function (): string {
  // Generate a unique session ID
  const randomBytes = crypto.randomBytes(16);
  return `session_${randomBytes.toString("hex")}`;
};

ViewTrackingSchema.statics.hashIP = function (ip: string): string {
  // Hash IP address for privacy while maintaining analytics capability
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_SALT || "default_salt"))
    .digest("hex");
};

ViewTrackingSchema.statics.hasViewed = async function (
  exposeId: string,
  sessionId: string
): Promise<boolean> {
  const existing = await this.findOne({ exposeId, sessionId });
  return !!existing;
};

ViewTrackingSchema.statics.recordView = async function (
  exposeId: string,
  sessionId: string,
  ipHash: string,
  userAgent: string
): Promise<boolean> {
  try {
    await this.create({
      exposeId,
      sessionId,
      ipHash,
      userAgent,
    });
    return true;
  } catch (error: any) {
    // If it's a duplicate key error (E11000), the view was already recorded
    if (error.code === 11000) {
      return false;
    }
    throw error;
  }
};

ViewTrackingSchema.statics.getViewCount = async function (
  exposeId: string
): Promise<number> {
  return this.countDocuments({ exposeId });
};

ViewTrackingSchema.statics.getUniqueViewCount = async function (
  exposeId: string
): Promise<number> {
  const uniqueViews = await this.aggregate([
    { $match: { exposeId } },
    { $group: { _id: "$ipHash" } },
    { $count: "uniqueViews" },
  ]);

  return uniqueViews.length > 0 ? uniqueViews[0].uniqueViews : 0;
};

ViewTrackingSchema.statics.getViewStats = async function (exposeId: string) {
  const [totalViews, uniqueViews, recentViews] = await Promise.all([
    this.countDocuments({ exposeId }),
    this.getUniqueViewCount(exposeId),
    this.countDocuments({
      exposeId,
      viewedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    }),
  ]);

  return {
    totalViews,
    uniqueViews,
    recentViews,
  };
};

// Pre-save middleware for additional validation
ViewTrackingSchema.pre("save", function (next) {
  // Validate that the view is not too old (prevent backdating)
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  if (this.viewedAt && this.viewedAt < oneHourAgo && this.isNew) {
    return next(
      new Error("Cannot create views with timestamps older than 1 hour")
    );
  }

  next();
});

// Clear the model cache in development to ensure schema changes take effect
if (process.env.NODE_ENV === "development" && models.ViewTracking) {
  delete models.ViewTracking;
}

export const ViewTracking =
  models.ViewTracking ||
  model<IViewTracking>("ViewTracking", ViewTrackingSchema);

// Export static methods for easier access
export const ViewTrackingUtils = {
  generateSessionId: ViewTrackingSchema.statics.generateSessionId,
  hashIP: ViewTrackingSchema.statics.hashIP,
  hasViewed: ViewTrackingSchema.statics.hasViewed,
  recordView: ViewTrackingSchema.statics.recordView,
  getViewCount: ViewTrackingSchema.statics.getViewCount,
  getUniqueViewCount: ViewTrackingSchema.statics.getUniqueViewCount,
  getViewStats: ViewTrackingSchema.statics.getViewStats,
};
