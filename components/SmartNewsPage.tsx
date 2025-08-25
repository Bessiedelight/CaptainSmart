"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  Vote,
  Trophy,
  Music,
  Compass,
} from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { formatDate, calculateReadTime } from "@/lib/utils/scraping-utils";

// Google Fonts will be imported via CSS or layout

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  publishDate: string;
  category: string;
  tags: string[];
  imageUrls: string[];
  metadata: {
    wordCount: number;
  };
}

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tag: string;
  readTime: string;
  image: string;
}

interface SmartNewsPageProps {
  title: string;
  description: string;
  iconName?: "vote" | "trophy" | "music" | "compass";
  category?: string; // If provided, filters by category. If not, shows all articles
  showCategories?: boolean; // Whether to show category filter buttons
  searchPlaceholder?: string;
  loadingText?: string;
  errorTitle?: string;
  errorDescription?: string;
  noResultsTitle?: string;
  noResultsDescription?: string;
  loadMoreText?: string;
  showBackLink?: boolean;
  backLinkText?: string;
  backLinkHref?: string;
}

const categories = [
  "All",
  "Politics",
  "Sports",
  "Business",
  "Entertainment",
  "General",
];

export default function SmartNewsPage({
  title,
  description,
  iconName,
  category,
  showCategories = false,
  searchPlaceholder = "Search articles...",
  loadingText = "Loading articles...",
  errorTitle = "Unable to load articles",
  errorDescription = "There was an issue loading the latest news content.",
  noResultsTitle = "No articles found",
  noResultsDescription = "No articles available at the moment",
  loadMoreText = "Load More Articles",
  showBackLink = false,
  backLinkText = "← Back to All News",
  backLinkHref = "/smart-news/explore",
}: SmartNewsPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(12);

  // Fetch articles from database
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(false);

        // Import database actions
        const { getRandomArticles, getArticlesByCategory } = await import(
          "@/lib/action/articleAction"
        );

        let fetchedArticles;

        if (category) {
          // Fetch articles by specific category
          fetchedArticles = await getArticlesByCategory({
            category,
            limit: 50,
          });
        } else {
          // Fetch random articles for explore page
          fetchedArticles = await getRandomArticles({ limit: 100 });
        }

        if (fetchedArticles && fetchedArticles.length > 0) {
          // Convert database format to component format
          const convertedArticles = fetchedArticles.map((article: any) => ({
            id: article.articleId,
            title: article.title,
            content: article.content,
            summary: article.summary,
            author: article.author,
            publishDate: article.publishDate,
            category: article.category,
            tags: article.tags || [],
            imageUrls: article.imageUrls || [],
            metadata: {
              wordCount: article.metadata?.wordCount || 0,
            },
          }));

          setArticles(convertedArticles);
        } else {
          setArticles([]);
        }
      } catch (err) {
        console.error("Failed to fetch articles:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [category]);

  // Convert Article to NewsItem format
  const convertToNewsItem = (article: Article): NewsItem => {
    return {
      id: article.id,
      title: article.title,
      excerpt: article.summary || article.content.substring(0, 150) + "...",
      author: article.author,
      date: formatDate(article.publishDate),
      tag: article.category,
      readTime: calculateReadTime(article.metadata.wordCount),
      image:
        article.imageUrls && article.imageUrls.length > 0
          ? article.imageUrls[0]
          : "",
    };
  };

  // Filter and search articles
  useEffect(() => {
    let filtered = articles;

    // Filter by category (only if showCategories is true)
    if (showCategories && selectedCategory !== "All") {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Convert to NewsItem format and apply display limit
    const newsItems = filtered.map(convertToNewsItem).slice(0, displayLimit);

    setFilteredArticles(newsItems);
  }, [articles, selectedCategory, searchQuery, displayLimit, showCategories]);

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setDisplayLimit(12); // Reset display limit when changing category
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setDisplayLimit(12); // Reset display limit when searching
  };

  const loadMoreArticles = () => {
    setDisplayLimit((prev) => prev + 12);
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
        // Refresh articles after successful scraping
        window.location.reload();
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

  const getResultsText = () => {
    if (searchQuery) {
      const categoryText = category ? ` ${category.toLowerCase()}` : "";
      return `Showing ${filteredArticles.length}${categoryText} results for "${searchQuery}"`;
    }

    if (showCategories && selectedCategory !== "All") {
      return `Showing ${filteredArticles.length} articles in ${selectedCategory}`;
    }

    const categoryText = category ? ` ${category.toLowerCase()}` : "";
    return `Showing ${filteredArticles.length}${categoryText} articles`;
  };

  const getNoResultsText = () => {
    if (searchQuery) {
      const categoryText = category ? ` ${category.toLowerCase()}` : "";
      return `No${categoryText} articles match your search for "${searchQuery}"`;
    }
    return noResultsDescription;
  };

  const getIcon = () => {
    switch (iconName) {
      case "vote":
        return Vote;
      case "trophy":
        return Trophy;
      case "music":
        return Music;
      case "compass":
        return Compass;
      default:
        return null;
    }
  };

  const Icon = getIcon();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {errorTitle}
          </h3>
          <p className="text-gray-500 mb-4">{errorDescription}</p>
          <button
            onClick={handleManualScraping}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-800 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scrape Latest News</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            {Icon && <Icon className="w-12 h-12 text-black mr-4" />}
            <h1
              className="text-4xl font-bold text-black"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              {title}
            </h1>
          </div>
          <p className="text-gray-700 max-w-2xl mx-auto text-lg">
            {description}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        {/* Category Filter */}
        {showCategories && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((categoryName) => (
              <button
                key={categoryName}
                onClick={() => handleCategoryChange(categoryName)}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors border ${
                  categoryName === selectedCategory
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-black"
                }`}
              >
                {categoryName}
              </button>
            ))}
          </div>
        )}

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600 text-center">{getResultsText()}</p>
        </div>

        {/* News Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/smart-news/${article.id}`}
                className="bg-white rounded-sm overflow-hidden border border-gray-200 hover:border-black transition-colors duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <SafeImage
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    category={category || article.tag}
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs text-black font-medium bg-gray-100 px-2 py-1 rounded-sm uppercase tracking-wide">
                      {category || article.tag}
                    </span>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{article.readTime}</span>
                    </div>
                  </div>

                  <h3
                    className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 group-hover:text-black transition-colors"
                    style={{
                      fontFamily: "Newsreader, serif",
                      fontWeight: "800",
                    }}
                  >
                    {article.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {Icon ? (
              <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            ) : (
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {noResultsTitle}
            </h3>
            <p className="text-gray-500 mb-4">{getNoResultsText()}</p>
            {!searchQuery && (
              <button
                onClick={handleManualScraping}
                className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-800 transition-colors mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scrape Latest News</span>
              </button>
            )}
          </div>
        )}

        {/* Load More Button */}
        {filteredArticles.length > 0 &&
          filteredArticles.length >= displayLimit && (
            <div className="text-center mt-12">
              <button
                onClick={loadMoreArticles}
                className="bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {loadMoreText}
              </button>
            </div>
          )}

        {/* Back Link */}
        {showBackLink && (
          <div className="text-center mt-8">
            <Link
              href={backLinkHref}
              className="text-black font-medium hover:text-gray-700 transition-colors"
            >
              {backLinkText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
