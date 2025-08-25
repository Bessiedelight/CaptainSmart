import { Schema, model, models, Document } from "mongoose";

export interface IArticleMetadata {
  scrapingTimestamp: Date;
  sourceUrl: string;
  wordCount: number;
  estimatedReadTime: number;
}

export interface IAiMetadata {
  processingTimestamp: Date;
  modelUsed: string;
  confidenceScore: number;
  originalWordCount: number;
  processedWordCount: number;
}

export interface IArticle extends Document {
  articleId: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  publishDate: Date;
  category: "Politics" | "Sports" | "Business" | "Entertainment" | "General";
  tags: string[];
  imageUrls: string[];
  metadata: IArticleMetadata;
  aiProcessingMetadata: IAiMetadata;
  status: "draft" | "published" | "archived";
  isActive: boolean;
  views: number;
  lastViewed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const articleMetadataSchema = new Schema<IArticleMetadata>({
  scrapingTimestamp: {
    type: Date,
    default: Date.now,
  },
  sourceUrl: {
    type: String,
    required: true,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  estimatedReadTime: {
    type: Number,
    default: 0,
  },
});

const aiMetadataSchema = new Schema<IAiMetadata>({
  processingTimestamp: {
    type: Date,
    default: Date.now,
  },
  modelUsed: {
    type: String,
    default: "gemini-2.0-flash-exp",
  },
  confidenceScore: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1,
  },
  originalWordCount: {
    type: Number,
    default: 0,
  },
  processedWordCount: {
    type: Number,
    default: 0,
  },
});

const ArticleSchema = new Schema<IArticle>(
  {
    articleId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    publishDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Politics", "Sports", "Business", "Entertainment", "General"],
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    imageUrls: [
      {
        type: String,
        validate: {
          validator: function (url: string) {
            return /^https?:\/\/.+/.test(url);
          },
          message: "Invalid image URL format",
        },
      },
    ],
    metadata: {
      type: articleMetadataSchema,
      required: true,
    },
    aiProcessingMetadata: {
      type: aiMetadataSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    lastViewed: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "articles",
  }
);

// Indexes for better query performance
ArticleSchema.index({ publishDate: -1, category: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ "metadata.sourceUrl": 1 });
ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ title: "text", content: "text", summary: "text" });

export const Article =
  models.Article || model<IArticle>("Article", ArticleSchema);
