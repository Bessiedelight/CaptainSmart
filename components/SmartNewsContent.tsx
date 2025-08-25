/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { User, Clock, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import SafeImage from "./SafeImage";

interface NewsCardProps {
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

interface TrendingCardProps {
  id: string;
  image: string;
  title: string;
  author: string;
  date: string;
  tag: string;
  readTime: string;
}

interface SmartNewsData {
  featured: NewsCardProps | null;
  sideArticles: NewsCardProps[];
  trending: TrendingCardProps[];
  stats: {
    totalArticles: number;
    lastUpdated: string;
    categories: Record<string, number>;
  };
}

const NewsCard: React.FC<NewsCardProps> = ({
  id,
  image,
  title,
  excerpt,
  author,
  date,
  tag,
  readTime,
  size = "small",
}) => {
  const CardContent = () => {
    if (size === "large") {
      return (
        <div className="relative rounded-sm overflow-hidden h-full bg-gray-900 cursor-pointer border border-transparent hover:border-[#D4A299] transition-colors duration-300">
          <div className="absolute inset-0">
            <SafeImage
              src={image}
              alt={title}
              fill
              className="object-cover"
              category={tag}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center space-x-2 text-white/80">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm">by {author}</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 text-white/80 text-sm z-20">
            {date}
          </div>
          <div className="absolute bottom-6 left-6 right-6 z-20">
            <h1 className="text-white text-3xl font-bold leading-tight mb-4">
              {title}
            </h1>
            <p className="text-white/90 text-base leading-relaxed">{excerpt}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start space-x-4 bg-white rounded-sm p-4 h-full overflow-hidden cursor-pointer border border-transparent hover:border-[#D4A299] transition-colors duration-300">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">{author}</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-400">{date}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-base leading-tight mb-2 line-clamp-2 hover:text-[#D4A299] transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-xs mb-3 leading-relaxed line-clamp-2">
            {excerpt}
          </p>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-[#D4A299] font-medium">{tag}</span>
            <span className="text-xs text-gray-400">•</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{readTime}</span>
            </div>
          </div>
        </div>
        <div className="w-20 h-14 rounded-sm overflow-hidden flex-shrink-0">
          <SafeImage
            src={image}
            alt={title}
            width={80}
            height={56}
            className="w-full h-full object-cover"
            category={tag}
          />
        </div>
      </div>
    );
  };

  if (id) {
    return (
      <Link href={`/smart-news/${id}`}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

const TrendingCard: React.FC<TrendingCardProps> = ({
  id,
  image,
  title,
  author,
  date,
  tag,
  readTime,
}) => {
  return (
    <Link href={`/smart-news/${id}`}>
      <div className="bg-white rounded-sm overflow-hidden cursor-pointer border border-transparent hover:border-[#D4A299] transition-colors duration-300">
        <div className="h-32 overflow-hidden">
          <SafeImage
            src={image}
            alt={title}
            width={400}
            height={128}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            category={tag}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600">{author}</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-400">{date}</span>
          </div>
          <h3 className="font-bold text-gray-900 text-base leading-tight mb-3 hover:text-[#D4A299] transition-colors">
            {title}
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-[#D4A299] font-medium">{tag}</span>
            <span className="text-sm text-gray-400">•</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-400">{readTime}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const LoadingCard: React.FC<{ size?: "small" | "large" }> = ({
  size = "small",
}) => {
  if (size === "large") {
    return (
      <div className="relative rounded-sm overflow-hidden h-full bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-300 to-gray-200" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-4 bg-white rounded-sm p-4 h-full">
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </div>
      <div className="w-20 h-14 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
};

const ErrorMessage: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-700 mb-2">
      Unable to load articles
    </h3>
    <p className="text-gray-500 mb-4">
      There was an issue loading the latest news content.
    </p>
    <button
      onClick={onRetry}
      className="flex items-center space-x-2 px-4 py-2 bg-[#D4A299] text-white rounded hover:bg-[#B8927A] transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      <span>Try Again</span>
    </button>
  </div>
);

export const SmartNewsContent: React.FC = () => {
  const [data, setData] = useState<SmartNewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      // Import database actions
      const { getRecentArticles, getRandomArticles } = await import(
        "@/lib/action/articleAction"
      );

      // Fetch recent articles from database
      const recentArticles = await getRecentArticles({ limit: 10 });
      const randomArticles = await getRandomArticles({ limit: 6 });

      if (recentArticles && recentArticles.length > 0) {
        // Convert database articles to display format
        const convertedArticles = recentArticles.map((article: any) => {
          // Get a valid image URL or fallback
          const getImageUrl = () => {
            if (article.imageUrls && article.imageUrls.length > 0) {
              const firstImage = article.imageUrls[0];
              if (firstImage && firstImage.trim() !== "") {
                return firstImage;
              }
            }
            // Return empty string to let SafeImage handle fallback
            return "";
          };

          return {
            id: article.articleId,
            image: getImageUrl(),
            title: article.title,
            excerpt: article.summary,
            author: article.author,
            date: new Date(article.publishDate).toLocaleDateString(),
            tag: article.category,
            readTime: `${article.metadata.estimatedReadTime} min read`,
          };
        });

        const convertedTrending = randomArticles.map((article: any) => {
          // Get a valid image URL or fallback for trending articles
          const getImageUrl = () => {
            if (article.imageUrls && article.imageUrls.length > 0) {
              const firstImage = article.imageUrls[0];
              if (firstImage && firstImage.trim() !== "") {
                return firstImage;
              }
            }
            // Return empty string to let SafeImage handle fallback
            return "";
          };

          return {
            id: article.articleId,
            image: getImageUrl(),
            title: article.title,
            author: article.author,
            date: new Date(article.publishDate).toLocaleDateString(),
            tag: article.category,
            readTime: `${article.metadata.estimatedReadTime} min read`,
          };
        });

        setData({
          featured: convertedArticles.length > 0 ? convertedArticles[0] : null,
          sideArticles: convertedArticles.slice(1, 4),
          trending: convertedTrending,
          stats: {
            totalArticles: recentArticles.length,
            lastUpdated: new Date().toISOString(),
            categories: {},
          },
        });
      } else {
        // No articles available, show empty state
        setData({
          featured: null,
          sideArticles: [],
          trending: [],
          stats: {
            totalArticles: 0,
            lastUpdated: new Date().toISOString(),
            categories: {},
          },
        });
      }
    } catch (err) {
      console.error("Failed to fetch news data:", err);
      setError(true);
      // Use fallback data on error
      setData(await getFallbackData());
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array

  const getFallbackData = async (): Promise<SmartNewsData> => {
    // Import and use the frontend integration service for fallback
    try {
      const { frontendIntegration } = await import(
        "@/lib/services/frontend-integration"
      );
      const fallbackContent = frontendIntegration.generateFallbackContent();

      return {
        featured: fallbackContent.featured,
        sideArticles: fallbackContent.sideArticles,
        trending: fallbackContent.trending,
        stats: {
          totalArticles: 0,
          lastUpdated: new Date().toISOString(),
          categories: {},
        },
      };
    } catch {
      // Ultimate fallback if even the service fails
      return {
        featured: null,
        sideArticles: [],
        trending: [],
        stats: {
          totalArticles: 0,
          lastUpdated: new Date().toISOString(),
          categories: {},
        },
      };
    }
  };

  const handleManualScraping = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/scraping/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":
            process.env.NEXT_PUBLIC_SCRAPING_API_KEY || "dev-api-key",
        },
        body: JSON.stringify({
          mode: "websites",
          websites: ["CitiNewsroom"],
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data after successful scraping
        await fetchData();
        alert(
          `Scraping completed! Processed ${result.data.result.totalArticlesProcessed} articles`
        );
      } else {
        alert(`Scraping failed: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error("Scraping error:", error);
      alert("Failed to start scraping. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Now fetchData is stable

  // Rest of the component remains the same...
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {/* Featured Article Loading */}
        <div className="lg:col-span-2">
          <div className="h-[600px]">
            <LoadingCard size="large" />
          </div>
        </div>

        {/* Side Articles Loading */}
        <div className="lg:col-span-1 flex flex-col justify-between h-[600px]">
          <div className="h-[180px]">
            <LoadingCard />
          </div>
          <div className="h-[180px]">
            <LoadingCard />
          </div>
          <div className="h-[180px]">
            <LoadingCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage onRetry={fetchData} />;
  }

  if (!data) {
    return <ErrorMessage onRetry={fetchData} />;
  }

  return (
    <>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {/* Featured Article */}
        <div className="lg:col-span-2">
          <div className="h-[600px]">
            {data.featured ? (
              <NewsCard {...data.featured} size="large" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-sm">
                <p className="text-gray-500 mb-4">
                  No featured article available
                </p>
                <button
                  onClick={handleManualScraping}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#D4A299] text-white rounded hover:bg-[#B8927A] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scrape Latest News</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Side Articles */}
        <div className="lg:col-span-1 flex flex-col justify-between h-[600px]">
          {data.sideArticles.length > 0
            ? data.sideArticles.slice(0, 3).map((article, index) => (
                <div key={article.id || index} className="h-[180px]">
                  <NewsCard {...article} />
                </div>
              ))
            : // Show placeholders if no side articles
              Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-[180px] flex items-center justify-center bg-gray-100 rounded-sm"
                >
                  <p className="text-gray-500 text-sm">No articles available</p>
                </div>
              ))}
        </div>
      </div>

      {/* Trending Section */}
      <div className="bg-white rounded-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Trending now</h2>
          <div className="flex items-center space-x-4">
            {data.stats.totalArticles > 0 && (
              <span className="text-sm text-gray-500">
                {data.stats.totalArticles} articles • Updated{" "}
                {new Date(data.stats.lastUpdated).toLocaleDateString()}
              </span>
            )}
            <Link
              href="/smart-news/explore"
              className="text-[#D4A299] font-medium hover:text-[#B8927A] transition-colors"
            >
              Explore all
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.trending.length > 0
            ? data.trending.map((article) => (
                <TrendingCard key={article.id} {...article} />
              ))
            : // Show placeholders if no trending articles
              Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="bg-gray-100 rounded-sm h-64 flex items-center justify-center"
                >
                  <p className="text-gray-500">No trending articles</p>
                </div>
              ))}
        </div>
      </div>
    </>
  );
};
