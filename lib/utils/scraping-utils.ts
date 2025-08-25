import {
  ProcessedArticle,
  NewsCardProps,
  TrendingCardProps,
} from "../types/scraping";

export function generateArticleId(): string {
  return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateReadTime(wordCount: number): string {
  const wordsPerMinute = 200;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function extractExcerpt(
  content: string,
  maxLength: number = 150
): string {
  const cleanContent = content.replace(/<[^>]*>/g, "").trim();
  if (cleanContent.length <= maxLength) return cleanContent;

  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

export function convertToNewsCard(article: ProcessedArticle): NewsCardProps {
  // Get fallback image based on category
  const getFallbackImage = (category: string): string => {
    const fallbacks = {
      Politics:
        "https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?auto=compress&cs=tinysrgb&w=800",
      Sports:
        "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800",
      Business:
        "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
      Entertainment:
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800",
      General:
        "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",
    };
    return fallbacks[category as keyof typeof fallbacks] || fallbacks.General;
  };

  // Validate image URL
  const getValidImageUrl = (): string => {
    if (article.imageUrls && article.imageUrls.length > 0) {
      const firstImage = article.imageUrls[0];
      if (firstImage && isValidUrl(firstImage)) {
        return firstImage;
      }
    }
    return getFallbackImage(article.category);
  };

  return {
    id: article.id,
    image: getValidImageUrl(),
    title: article.title,
    excerpt: extractExcerpt(article.summary || article.content),
    author: article.author,
    date: formatDate(article.publishDate),
    tag: article.category,
    readTime: calculateReadTime(article.metadata.wordCount),
  };
}

export function convertToTrendingCard(
  article: ProcessedArticle
): TrendingCardProps {
  // Get fallback image based on category
  const getFallbackImage = (category: string): string => {
    const fallbacks = {
      Politics:
        "https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?auto=compress&cs=tinysrgb&w=800",
      Sports:
        "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800",
      Business:
        "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
      Entertainment:
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800",
      General:
        "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",
    };
    return fallbacks[category as keyof typeof fallbacks] || fallbacks.General;
  };

  // Validate image URL
  const getValidImageUrl = (): string => {
    if (article.imageUrls && article.imageUrls.length > 0) {
      const firstImage = article.imageUrls[0];
      if (firstImage && isValidUrl(firstImage)) {
        return firstImage;
      }
    }
    return getFallbackImage(article.category);
  };

  return {
    id: article.id,
    image: getValidImageUrl(),
    title: article.title,
    author: article.author,
    date: formatDate(article.publishDate),
    tag: article.category,
    readTime: calculateReadTime(article.metadata.wordCount),
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
