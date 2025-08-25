import { Schema, model, models, Document } from "mongoose";

export interface IExpose extends Document {
  exposeId: string;
  title: string;
  description: string;
  hashtag: string;
  imageUrls: string[];
  audioUrl?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  views: number;
  shareCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExposeSchema = new Schema<IExpose>(
  {
    exposeId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `expose_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    hashtag: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (hashtag: string) {
          return (
            hashtag.startsWith("#") &&
            hashtag.length > 1 &&
            hashtag.length <= 50
          );
        },
        message: "Hashtag must start with # and be between 2-50 characters",
      },
    },
    imageUrls: [
      {
        type: String,
        validate: {
          validator: function (url: string) {
            // Accept both relative paths (/uploads/...) and full URLs (http://... or https://...)
            const isValid =
              /^(https?:\/\/.+|\/uploads\/expose-corner\/(images|audio)\/.+)$/.test(
                url
              );
            if (!isValid) {
              console.log(
                "Image URL validation failed for:",
                url,
                "Type:",
                typeof url
              );
            }
            return isValid;
          },
          message: "Invalid image URL format",
        },
      },
    ],
    audioUrl: {
      type: String,
      validate: {
        validator: function (url: string) {
          // Accept both relative paths (/uploads/...) and full URLs (http://... or https://...)
          const isValid =
            !url ||
            /^(https?:\/\/.+|\/uploads\/expose-corner\/(images|audio)\/.+)$/.test(
              url
            );
          if (!isValid) {
            console.log(
              "Audio URL validation failed for:",
              url,
              "Type:",
              typeof url
            );
          }
          return isValid;
        },
        message: "Invalid audio URL format",
      },
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    },
  },
  {
    timestamps: true,
    collection: "exposes",
  }
);

// Indexes for optimal query performance
ExposeSchema.index({ hashtag: 1 });
ExposeSchema.index({ createdAt: -1 });
ExposeSchema.index({ upvotes: -1, downvotes: 1 }); // For trending sort
ExposeSchema.index({ expiresAt: 1, createdAt: -1 }); // For expiring sort
ExposeSchema.index({ views: -1 }); // For sorting by popularity
ExposeSchema.index({ commentCount: -1 }); // For sorting by engagement
ExposeSchema.index({ views: -1, commentCount: -1, upvotes: -1 }); // Compound index for trending algorithm

// Automatic cleanup of expired documents (TTL index)
ExposeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for net votes (upvotes - downvotes) for trending calculation
ExposeSchema.virtual("netVotes").get(function () {
  return this.upvotes - this.downvotes;
});

// Virtual for time remaining until expiration
ExposeSchema.virtual("timeRemaining").get(function () {
  const now = new Date();
  const remaining = this.expiresAt.getTime() - now.getTime();
  return Math.max(0, remaining);
});

// Static methods for updating metrics
ExposeSchema.statics.incrementCommentCount = async function (exposeId: string) {
  return this.findOneAndUpdate(
    { exposeId, expiresAt: { $gt: new Date() } },
    { $inc: { commentCount: 1 } },
    { new: true }
  );
};

ExposeSchema.statics.decrementCommentCount = async function (exposeId: string) {
  return this.findOneAndUpdate(
    { exposeId, expiresAt: { $gt: new Date() } },
    { $inc: { commentCount: -1 } },
    { new: true }
  );
};

ExposeSchema.statics.incrementViews = async function (exposeId: string) {
  return this.findOneAndUpdate(
    { exposeId, expiresAt: { $gt: new Date() } },
    { $inc: { views: 1 } },
    { new: true }
  );
};

ExposeSchema.statics.incrementShareCount = async function (exposeId: string) {
  return this.findOneAndUpdate(
    { exposeId, expiresAt: { $gt: new Date() } },
    { $inc: { shareCount: 1 } },
    { new: true }
  );
};

// Ensure virtuals are included in JSON output
ExposeSchema.set("toJSON", { virtuals: true });
ExposeSchema.set("toObject", { virtuals: true });

// Clear the model cache in development to ensure schema changes take effect
if (process.env.NODE_ENV === "development" && models.Expose) {
  delete models.Expose;
}

export const Expose = models.Expose || model<IExpose>("Expose", ExposeSchema);

// Re-export predefined hashtags for convenience
export { PREDEFINED_HASHTAGS } from "@/lib/constants";
