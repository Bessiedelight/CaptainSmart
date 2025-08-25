// Core article interfaces
export interface RawArticle {
  url: string;
  title: string;
  content: string;
  author: string;
  publishDate: string;
  category: string;
  imageUrls: string[];
  metadata: ArticleMetadata;
}

export interface ProcessedArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  publishDate: string;
  category: string;
  tags: string[];
  imageUrls: string[]; // Preserved from original
  metadata: ArticleMetadata;
  aiProcessingMetadata: AIMetadata;
}

export interface ArticleMetadata {
  scrapingTimestamp: Date;
  sourceUrl: string;
  wordCount: number;
  estimatedReadTime: number;
}

export interface AIMetadata {
  processingTimestamp: Date;
  modelUsed: string;
  confidenceScore: number;
  originalWordCount: number;
  processedWordCount: number;
}

// Configuration interfaces
export interface ScrapingConfig {
  targetWebsites: WebsiteConfig[];
  scheduleTime: string; // "06:00"
  batchSize: number;
  maxArticlesPerRun: number;
  timeoutMs: number;
}

export interface WebsiteConfig {
  name: string;
  baseUrl: string;
  categoryPages: string[];
  selectors: {
    articleLinks: string;
    title: string;
    content: string;
    author: string;
    publishDate: string;
    images: string;
  };
}

export interface AIConfig {
  provider: string;
  model: string;
  batchSize: number;
  maxTokens: number;
  temperature: number;
}

// Error handling
export enum ErrorType {
  NETWORK_ERROR = "network_error",
  PARSING_ERROR = "parsing_error",
  AI_PROCESSING_ERROR = "ai_processing_error",
  VALIDATION_ERROR = "validation_error",
}

export interface ScrapingError {
  type: ErrorType;
  message: string;
  url?: string;
  timestamp: Date;
  retryable: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>;
}

export interface ScrapingResult {
  totalArticlesProcessed: number;
  successfulArticles: number;
  failedArticles: number;
  processingTime: number;
  errors: ScrapingError[];
}

// Frontend integration types
export interface NewsCardProps {
  id?: string;
  image: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tag: string;
  readTime: string;
  size?: "small" | "large";
}

export interface TrendingCardProps {
  id: string;
  image: string;
  title: string;
  author: string;
  date: string;
  tag: string;
  readTime: string;
}
