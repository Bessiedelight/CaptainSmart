import { Schema, model, models, Document } from "mongoose";
import crypto from "crypto";

export interface IComment extends Document {
  commentId: string;
  exposeId: string;
  content: string;
  anonymousId: string;
  ipHash: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    commentId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    },
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
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
      validate: {
        validator: function (content: string) {
          // Check if content is not just whitespace
          return content.trim().length > 0;
        },
        message: "Comment content cannot be empty or only whitespace",
      },
    },
    anonymousId: {
      type: String,
      required: true,
      validate: {
        validator: function (anonymousId: string) {
          // Ensure anonymous ID follows expected format
          return /^anon_[a-f0-9]{16}$/.test(anonymousId);
        },
        message: "Invalid anonymous ID format",
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
  },
  {
    timestamps: true,
    collection: "comments",
  }
);

// Indexes for optimal query performance
CommentSchema.index({ exposeId: 1, createdAt: -1 }); // For fetching comments by expose
CommentSchema.index({ anonymousId: 1 }); // For tracking user comments
CommentSchema.index({ ipHash: 1, createdAt: -1 }); // For spam prevention
CommentSchema.index({ createdAt: -1 }); // For general sorting
CommentSchema.index({ exposeId: 1, anonymousId: 1 }); // For user-specific comments on expose

// TTL index to automatically delete old comments after 90 days
CommentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static methods for the model
CommentSchema.statics.generateAnonymousId = function (): string {
  // Generate a consistent anonymous ID based on IP and user agent
  const randomBytes = crypto.randomBytes(8);
  return `anon_${randomBytes.toString("hex")}`;
};

CommentSchema.statics.hashIP = function (ip: string): string {
  // Hash IP address for privacy while maintaining spam prevention
  return crypto
    .createHash("sha256")
    .update(ip + process.env.IP_SALT || "default_salt")
    .digest("hex");
};

CommentSchema.statics.generateConsistentAnonymousId = function (
  ip: string,
  userAgent: string
): string {
  // Generate consistent anonymous ID for same IP + user agent combination
  const combined = `${ip}_${userAgent}`;
  const hash = crypto
    .createHash("sha256")
    .update(combined + (process.env.ANON_ID_SALT || "default_anon_salt"))
    .digest("hex");
  return `anon_${hash.substring(0, 16)}`;
};

// Instance methods
CommentSchema.methods.isFromSameUser = function (
  otherComment: IComment
): boolean {
  return this.anonymousId === otherComment.anonymousId;
};

// Pre-save middleware for additional validation
CommentSchema.pre("save", function (next) {
  // Ensure content is properly sanitized
  if (this.content) {
    this.content = this.content.trim();
  }

  // Validate that the comment is not too old (prevent backdating)
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  if (this.createdAt && this.createdAt < fiveMinutesAgo && this.isNew) {
    return next(
      new Error("Cannot create comments with timestamps older than 5 minutes")
    );
  }

  next();
});

// Virtual for formatted creation time
CommentSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return this.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
});

// Ensure virtuals are included in JSON output
CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

// Clear the model cache in development to ensure schema changes take effect
if (process.env.NODE_ENV === "development" && models.Comment) {
  delete models.Comment;
}

export const Comment =
  models.Comment || model<IComment>("Comment", CommentSchema);

// Export static methods for easier access
export const CommentUtils = {
  generateAnonymousId: CommentSchema.statics.generateAnonymousId,
  hashIP: CommentSchema.statics.hashIP,
  generateConsistentAnonymousId:
    CommentSchema.statics.generateConsistentAnonymousId,
};
