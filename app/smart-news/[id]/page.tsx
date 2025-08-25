"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Clock,
  ArrowLeft,
  AlertCircle,
  Share2,
  Bookmark,
  Play,
} from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import AudioPlayer from "@/components/AudioPlayer";
import { formatDate, calculateReadTime } from "@/lib/utils/scraping-utils";

interface NewsDetailProps {
  params: Promise<{
    id: string;
  }>;
}

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
    scrapingTimestamp: string;
    sourceUrl: string;
    wordCount: number;
    estimatedReadTime: number;
  };
}

export default function NewsDetail({ params }: NewsDetailProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Await the params Promise
        const resolvedParams = await params;
        setArticleId(resolvedParams.id);
      } catch (err) {
        console.error("Failed to resolve params:", err);
        setError(true);
        setLoading(false);
      }
    };

    initializeComponent();
  }, [params]);

  useEffect(() => {
    if (!articleId) return;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(false);

        // Import database actions
        const { getArticleById, getArticlesByCategory } = await import(
          "@/lib/action/articleAction"
        );

        // Fetch the specific article from database
        const articleData = await getArticleById(articleId);

        if (articleData) {
          // Convert database format to component format
          const convertedArticle = {
            id: articleData.articleId,
            title: articleData.title,
            content: articleData.content,
            summary: articleData.summary,
            author: articleData.author,
            publishDate: articleData.publishDate,
            category: articleData.category,
            tags: articleData.tags || [],
            imageUrls: articleData.imageUrls || [],
            metadata: {
              scrapingTimestamp:
                articleData.metadata?.scrapingTimestamp ||
                new Date().toISOString(),
              sourceUrl: articleData.metadata?.sourceUrl || "",
              wordCount: articleData.metadata?.wordCount || 0,
              estimatedReadTime: articleData.metadata?.estimatedReadTime || 0,
            },
          };

          setArticle(convertedArticle);

          // Fetch related articles (same category, excluding current article)
          const relatedArticles = await getArticlesByCategory({
            category: articleData.category,
            limit: 6,
          });

          if (relatedArticles && relatedArticles.length > 0) {
            const filtered = relatedArticles
              .filter((a: any) => a.articleId !== articleId)
              .slice(0, 2)
              .map((article: any) => ({
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
                  scrapingTimestamp:
                    article.metadata?.scrapingTimestamp ||
                    new Date().toISOString(),
                  sourceUrl: article.metadata?.sourceUrl || "",
                  wordCount: article.metadata?.wordCount || 0,
                  estimatedReadTime: article.metadata?.estimatedReadTime || 0,
                },
              }));

            setRelatedArticles(filtered);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch article:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Article Not Found
          </h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/smart-news"
            className="inline-flex items-center space-x-2 px-6 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Smart News</span>
          </Link>
        </div>
      </div>
    );
  }

  // Format content for display
  const formatContent = (content: string): string => {
    // Split content into paragraphs and wrap each in <p> tags
    const paragraphs = content
      .split("\n\n")
      .filter((p) => p.trim().length > 0)
      .map((p) => `<p class="mb-6 leading-8">${p.trim()}</p>`)
      .join("\n\n");

    return paragraphs || `<p class="mb-6 leading-8">${content}</p>`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/smart-news"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-black transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Smart News</span>
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-6">
        {/* Title Section */}
        <div className="py-12 border-b border-gray-100">
          <h1
            className="text-4xl md:text-5xl font-bold text-black leading-tight mb-6"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            {article.title}
          </h1>

          <p
            className="text-xl text-gray-600 leading-8 mb-8 font-light"
            style={{ fontFamily: "Newsreader, serif" }}
          >
            {article.summary}
          </p>
        </div>
        {/* Article Meta & Actions */}
        <div className="py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Author avatars placeholder */}
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gray-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-black">
                  By{" "}
                  {article.author.split(",").map((author, index) => (
                    <span
                      key={index}
                      className="hover:underline cursor-pointer"
                    >
                      {author.trim()}
                      {index < article.author.split(",").length - 1 && ", "}
                    </span>
                  ))}
                </div>
                <div className="text-gray-500 mt-1">
                  {formatDate(article.publishDate)}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-black transition-colors">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share full article</span>
              </button>
              <button className="p-2 text-gray-600 hover:text-black transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Image */}
        <div className="py-8">
          <div className="relative aspect-[16/10] mb-4">
            <SafeImage
              src={article.imageUrls[0] || ""}
              alt={article.title}
              fill
              className="object-cover"
              category={article.category}
            />
          </div>
          <div className="text-sm text-gray-500 leading-5">
            The Justice Department previously issued guidance in early 2021
            about protecting federal court documents after the case management
            system was first hacked.
            <span className="text-gray-400 ml-2">Michael A. McCoy</span>
          </div>
        </div>

        {/* Article Body */}
        <div className="max-w-3xl">
          <div
            className="prose prose-lg max-w-none text-gray-900 font-light leading-8"
            style={{ fontFamily: "Newsreader, serif" }}
            dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
          />
        </div>
        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2
              className="text-2xl font-bold text-black mb-8"
              style={{ fontFamily: "Newsreader, serif" }}
            >
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/smart-news/${relatedArticle.id}`}
                  className="group"
                >
                  <div className="relative aspect-[16/10] mb-4">
                    <SafeImage
                      src={relatedArticle.imageUrls[0] || ""}
                      alt={relatedArticle.title}
                      fill
                      className="object-cover group-hover:opacity-90 transition-opacity"
                      category={relatedArticle.category}
                    />
                  </div>
                  <h3
                    className="font-bold text-black mb-2 text-lg leading-tight group-hover:underline"
                    style={{ fontFamily: "Newsreader, serif" }}
                  >
                    {relatedArticle.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {relatedArticle.summary}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{relatedArticle.author}</span>
                    <span>•</span>
                    <span>{formatDate(relatedArticle.publishDate)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom spacing */}
        <div className="pb-16"></div>
      </div>
    </div>
  );
}
