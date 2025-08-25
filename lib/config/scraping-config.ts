import { ScrapingConfig, AIConfig } from "../types/scraping";

export const scrapingConfig: ScrapingConfig = {
  targetWebsites: [
    {
      name: "Graphic.com.gh",
      baseUrl: "https://www.graphic.com.gh",
      categoryPages: [
        "/politics",
        "/news/politics",
        "/category/politics",
        "/news",
      ],
      selectors: {
        articleLinks:
          'a[href*="/news/"], a[href*="/politics/"], a[href*="/article/"], a[href*="graphic.com.gh"]',
        title: "h1, .entry-title, .post-title, .article-title, .headline",
        content:
          ".article-details p, .raxo-content p, .com-content p, .view-article p, p",
        author:
          ".author, .byline, .post-author, .entry-author, .writer-name, .article-info .author",
        publishDate:
          ".date, .post-date, .entry-date, .publish-date, time, .published, .article-info .date",
        images:
          'img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"], .article-full-image img, .article-details img, .raxo-content img',
      },
    },
    {
      name: "GhanaWeb",
      baseUrl: "https://www.ghanaweb.com",
      categoryPages: [
        "/GhanaHomePage/politics/",
        "/GhanaHomePage/NewsArchive/politik.php",
      ],
      selectors: {
        articleLinks: 'a[href*="/NewsArchive/artikel.php"]',
        title: "h1, .article-title, .news-title",
        content: ".article-content, .news-content, .story-body, p",
        author: ".author, .byline, .writer",
        publishDate: ".date, .publish-date, .timestamp",
        images: 'img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"]',
      },
    },
    {
      name: "MyJoyOnline",
      baseUrl: "https://www.myjoyonline.com",
      categoryPages: ["/politics/", "/news/politics/"],
      selectors: {
        articleLinks: 'a[href*="/politics/"], a[href*="/news/"]',
        title: "h1, .entry-title, .post-title",
        content: ".entry-content, .post-content, .article-body",
        author: ".author-name, .byline",
        publishDate: ".entry-date, .post-date",
        images: ".entry-content img, .post-content img",
      },
    },
    {
      name: "ModernGhana",
      baseUrl: "https://www.modernghana.com",
      categoryPages: [
        "/politics/",
        "/news/politics/",
        "/category/politics/",
        "/news/",
      ],
      selectors: {
        articleLinks:
          'a[href*="/news/"], a[href*="/politics/"], a[href*="modernghana.com"]',
        title: "h1, .entry-title, .post-title, .article-title, .news-title",
        content:
          ".entry-content, .post-content, .article-content, .news-content, .story-body, p",
        author: ".author, .byline, .post-author, .entry-author, .writer-name",
        publishDate:
          ".date, .post-date, .entry-date, .publish-date, time, .published",
        images:
          'img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"], .entry-content img, .post-content img',
      },
    },
    {
      name: "CitiNewsroom",
      baseUrl: "https://citinewsroom.com",
      categoryPages: ["/news/"],
      selectors: {
        articleLinks:
          'a[href*="/2025/"], a[href*="/2024/"], article a, .post a',
        title: "h1, .entry-title, .post-title, .article-title, .news-title",
        content:
          ".entry-content, .post-content, .article-content, .news-content, .story-body, p",
        author: ".author, .byline, .post-author, .entry-author, .writer-name",
        publishDate:
          ".date, .post-date, .entry-date, .publish-date, time, .published",
        images:
          'img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"], .entry-content img, .post-content img',
      },
    },
  ],
  scheduleTime: "06:00",
  batchSize: 5,
  maxArticlesPerRun: 20,
  timeoutMs: 30000,
};

export const aiConfig: AIConfig = {
  provider: "google",
  model: "gemini-2.0-flash-exp", // Most advanced model - use with new API key
  batchSize: 3, // Smaller batches for detailed processing
  maxTokens: 16384, // Higher token limit for comprehensive content
  temperature: 0.7,
};

export const systemConfig = {
  storage: {
    retentionHours: 24, // Keep articles in memory for 24 hours
    maxArticlesPerCategory: 50,
  },
  fallbackImages: {
    politics:
      "https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?auto=compress&cs=tinysrgb&w=800",
    general:
      "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
};
