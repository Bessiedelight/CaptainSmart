"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import SmartNewsNavClean from "@/components/SmartNewsNavClean";
import { formatDate, calculateReadTime } from "@/lib/utils/scraping-utils";

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

export default function NYTLikeHome() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(false);
        const { getRandomArticles } = await import(
          "@/lib/action/articleAction"
        );
        const fetched = await getRandomArticles({ limit: 30 });
        if (fetched && fetched.length > 0) {
          const converted = fetched.map((a: any) => ({
            id: a.articleId ?? a.id ?? String(Math.random()),
            title: a.title ?? "",
            content: a.content ?? "",
            summary: a.summary ?? "",
            author: a.author ?? "Staff",
            publishDate: a.publishDate ?? new Date().toISOString(),
            category: a.category ?? "News",
            tags: a.tags ?? [],
            imageUrls: a.imageUrls ?? [],
            metadata: { wordCount: a.metadata?.wordCount ?? 0 },
          }));
          setArticles(converted);
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
  }, []);

  if (loading)
    return (
      <div className="loaderWrap">
        <div className="loader" />
        <div className="muted">Loading news articles…</div>
        <style jsx>{`
          .loaderWrap {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
            justify-content: center;
          }
          .loader {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 3px solid #eee;
            border-top-color: #333;
            animation: spin 1s linear infinite;
          }
          .muted {
            color: #777;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );

  if (error || articles.length === 0)
    return (
      <div className="errorWrap">
        <p className="muted">Unable to load news articles.</p>
        <style jsx>{`
          .errorWrap {
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .muted {
            color: #777;
          }
        `}</style>
      </div>
    );

  // slot articles into the layout (safe checks)
  const hero =
    articles.find((a) => (a.imageUrls || []).length > 0) || articles[0];
  const used = new Set<string>([hero?.id]);
  const leftList = articles.filter((a) => !used.has(a.id)).slice(0, 3);
  leftList.forEach((a) => used.add(a.id));
  const centerList = articles.filter((a) => !used.has(a.id)).slice(0, 3);
  centerList.forEach((a) => used.add(a.id));
  const rightList = articles.filter((a) => !used.has(a.id)).slice(0, 6);

  // helper to safely get image
  const bg = (a?: Article, idx = 0) =>
    a && a.imageUrls && a.imageUrls[idx]
      ? `url('${a.imageUrls[idx]}')`
      : "none";

  // Text truncation helpers
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const truncateTitle = (title: string, maxLength: number = 80): string => {
    return truncateText(title, maxLength);
  };

  const truncateSummary = (
    summary: string,
    maxLength: number = 150
  ): string => {
    return truncateText(summary, maxLength);
  };

  return (
    <>
      <SmartNewsNavClean />

      {/* Prominent Sub-Route Navigation */}
      <div className="subRouteNav">
        <div className="subRouteContainer">
          <Link href="/smart-news/politics" className="subRouteLink">
            <span className="subRouteTitle">POLITICS</span>
            <span className="subRouteDesc">Government & Policy News</span>
          </Link>
          <Link href="/smart-news/sports" className="subRouteLink">
            <span className="subRouteTitle">SPORTS</span>
            <span className="subRouteDesc">Latest Sports Updates</span>
          </Link>
          <Link href="/smart-news/entertainment" className="subRouteLink">
            <span className="subRouteTitle">ENTERTAINMENT</span>
            <span className="subRouteDesc">Music, Movies & Culture</span>
          </Link>
          <Link href="/smart-news/explore" className="subRouteLink">
            <span className="subRouteTitle">EXPLORE ALL</span>
            <span className="subRouteDesc">Browse All Categories</span>
          </Link>
        </div>
      </div>

      <div className="wrap">
        <main className="gridRoot">
          {/* LEFT: Main content area (2/3 of page) */}
          <div className="leftMainCol">
            {/* Hero section */}
            <div className="leadText">
              <Link href={`/smart-news/${hero?.id}`} className="leadTitle">
                {truncateTitle(hero?.title || "", 70)}
              </Link>
              <p className="leadSummary">
                {truncateSummary(hero?.summary || hero?.content || "", 140)}
              </p>
              <div className="readMeta">
                {calculateReadTime(hero?.metadata?.wordCount || 0)}
              </div>
            </div>

            {/* Hero Image */}
            <div className="heroImage">
              <SafeImage
                src={hero?.imageUrls?.[0] || ""}
                alt={hero?.title || "News image"}
                width={800}
                height={280}
                className="heroImageInner"
                category={hero?.category || "General"}
              />
              <div className="heroCaption">
                Photo: {hero?.author ?? "The Times"}
              </div>
            </div>

            {/* Featured article with image */}
            <div className="featuredArticle">
              {centerList[0]?.imageUrls?.[0] && (
                <div className="featuredImage">
                  <SafeImage
                    src={centerList[0].imageUrls[0]}
                    alt={centerList[0].title || "News image"}
                    width={220}
                    height={150}
                    className="featuredImageInner"
                    category={centerList[0].category || "General"}
                  />
                </div>
              )}
              <div className="featuredContent">
                <Link
                  href={`/smart-news/${centerList[0]?.id}`}
                  className="featuredTitle"
                >
                  {truncateTitle(centerList[0]?.title ?? "", 75)}
                </Link>
                <p className="featuredSummary">
                  {truncateSummary(
                    centerList[0]?.summary || centerList[0]?.content || "",
                    180
                  )}
                </p>
                <div className="featuredMeta">
                  <span className="author">
                    {truncateText(centerList[0]?.author || "Staff", 20)}
                  </span>
                  <span className="readTime">
                    {calculateReadTime(centerList[0]?.metadata?.wordCount || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="thinRule" />

            {/* Secondary articles grid */}
            <div className="secondaryGrid">
              {centerList.slice(1, 3).map((article, index) => (
                <div key={article?.id || index} className="secondaryArticle">
                  {article?.imageUrls?.[0] && (
                    <div className="secondaryImage">
                      <SafeImage
                        src={article.imageUrls[0]}
                        alt={article.title || "News image"}
                        width={300}
                        height={120}
                        className="secondaryImageInner"
                        category={article.category || "General"}
                      />
                    </div>
                  )}
                  <div className="secondaryContent">
                    <Link
                      href={`/smart-news/${article?.id}`}
                      className="secondaryTitle"
                    >
                      {truncateTitle(article?.title || "", 50)}
                    </Link>
                    <p className="secondarySummary">
                      {truncateSummary(
                        article?.summary || article?.content || "",
                        80
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional news cards section */}
            <div className="additionalNewsCards">
              <div className="newsCardsGrid">
                {articles.slice(6, 12).map((article, index) => (
                  <div key={article?.id || index} className="newsCard">
                    {article?.imageUrls?.[0] && (
                      <div className="newsCardImage">
                        <SafeImage
                          src={article.imageUrls[0]}
                          alt={article.title || "News image"}
                          width={400}
                          height={140}
                          className="newsCardImageInner"
                          category={article.category || "General"}
                        />
                      </div>
                    )}
                    <div className="newsCardContent">
                      <Link
                        href={`/smart-news/${article?.id}`}
                        className="newsCardTitle"
                      >
                        {truncateTitle(article?.title || "", 45)}
                      </Link>
                      <p className="newsCardSummary">
                        {truncateSummary(
                          article?.summary || article?.content || "",
                          70
                        )}
                      </p>
                      <div className="newsCardMeta">
                        <span className="newsCardAuthor">
                          {truncateText(article.author || "Staff", 15)}
                        </span>
                        <span className="newsCardReadTime">
                          {calculateReadTime(article.metadata?.wordCount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: sidebar matching screenshot */}
          <aside className="rightCol">
            {/* top featured small */}
            {rightList[0] && (
              <div className="sideCard">
                <div className="sideImg">
                  <SafeImage
                    src={rightList[0].imageUrls?.[0] || ""}
                    alt={rightList[0].title || "News image"}
                    width={300}
                    height={160}
                    className="sideImgInner"
                    category={rightList[0].category || "General"}
                  />
                </div>
                <Link
                  href={`/smart-news/${rightList[0].id}`}
                  className="sideTitle"
                >
                  {truncateTitle(rightList[0].title, 55)}
                </Link>
                <p className="muted smallSummary">
                  {truncateSummary(rightList[0].summary || "", 75)}
                </p>
              </div>
            )}

            <div className="miniGrid">
              {rightList.slice(1, 3).map((a) => (
                <div key={a.id} className="miniItem">
                  <div className="miniImg">
                    <SafeImage
                      src={a.imageUrls?.[0] || ""}
                      alt={a.title || "News image"}
                      width={150}
                      height={80}
                      className="miniImgInner"
                      category={a.category || "General"}
                    />
                  </div>
                  <Link href={`/smart-news/${a.id}`} className="miniTitle">
                    {truncateTitle(a.title, 40)}
                  </Link>
                </div>
              ))}
            </div>

            <div className="thinRule" />

            {/* Opinion block */}
            <div className="opinion">
              <div className="kicker">Opinion</div>
              <div className="opRow">
                <div className="opAvatar" />
                <div className="opText">
                  <div className="opAuthor">BRET STEPHENS</div>
                  <Link
                    href={`/smart-news/${rightList[3]?.id}`}
                    className="opTitle"
                  >
                    {truncateTitle(
                      rightList[3]?.title ?? "A Half-Baked Alaska Summit",
                      50
                    )}
                  </Link>
                  <div className="muted">
                    {calculateReadTime(rightList[3]?.metadata.wordCount || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* subscribe / popular placeholders */}
            <div className="popular">
              <div className="kicker">Popular on The Daily</div>
              <div className="popularList">
                {rightList.slice(4, 6).map((a) => (
                  <div key={a.id} className="popItem">
                    <div className="popImg">
                      <SafeImage
                        src={a.imageUrls?.[0] || ""}
                        alt={a.title || "News image"}
                        width={72}
                        height={60}
                        className="popImgInner"
                        category={a.category || "General"}
                      />
                    </div>
                    <Link href={`/smart-news/${a.id}`} className="popTitle">
                      {truncateTitle(a.title, 45)}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional articles moved from left side */}
            <div className="additionalArticles">
              <div className="kicker">More News</div>
              {leftList.map((a) => (
                <article key={a.id} className="additionalArticle">
                  <Link
                    href={`/smart-news/${a.id}`}
                    className="additionalTitle"
                  >
                    {truncateTitle(a.title, 60)}
                  </Link>
                  <p className="muted smallSummary">
                    {truncateSummary(a.summary || a.content || "", 100)}
                  </p>
                  <div className="readTiny">
                    {calculateReadTime(a.metadata.wordCount)}
                  </div>
                </article>
              ))}
            </div>

            <div className="liveBlock">
              <div className="liveK">
                LIVE <span className="liveT">16m ago</span>
              </div>
              <Link
                href={`/smart-news/${leftList[2]?.id ?? centerList[0]?.id}`}
                className="liveTitle"
              >
                {truncateTitle(
                  leftList[2]?.title ??
                    "National Guard to Be Deployed to D.C. Streets Tonight",
                  65
                )}
              </Link>
            </div>

            <div className="subscribe">
              <div className="kicker">Subscribe</div>
              <p className="muted smallSummary">
                Get our free daily roundup delivered to your inbox.
              </p>
              <button className="cta">Get the Rundown</button>
            </div>
          </aside>
        </main>

        <footer className="pageFooter">© The Daily — demo layout</footer>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lora:wght@400;500;600;700&family=Newsreader:wght@400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&display=swap");

        /* Prominent Sub-Route Navigation */
        .subRouteNav {
          background: #f8f8f8;
          border-top: 3px solid #000;
          border-bottom: 1px solid #ddd;
          padding: 24px 0;
        }
        .subRouteContainer {
          max-width: 80rem;
          margin: 0 auto;
          padding: 0 18px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }
        .subRouteLink {
          display: flex;
          flex-direction: column;
          padding: 20px;
          background: white;
          border: 2px solid #e5e5e5;
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .subRouteLink:hover {
          border-color: #000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .subRouteTitle {
          font-family: "Oswald", sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        .subRouteDesc {
          font-family: "Lora", serif;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }

        /* Container and global pacing */
        .wrap {
          max-width: 80rem;
          margin: 20px auto;
          padding: 0 18px;
          font-family: "Lora", serif;
        }

        .toplinks {
          border-top: 1px solid #dcdcdc;
          border-bottom: 2px solid #dcdcdc;
          padding: 10px 0;
          font-size: 13px;
        }
        .navCenter {
          display: flex;
          gap: 18px;
          justify-content: center;
          color: #000;
        }
        .navCenter span {
          color: #000;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s ease;
        }
        .navCenter span:hover {
          color: #333;
          text-decoration: underline;
        }

        /* main grid: two columns - left 2/3, right 1/3 */
        .gridRoot {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 50px;
          align-items: start;
          margin-top: 24px;
          position: relative;
        }
        .gridRoot::before {
          content: "";
          position: absolute;
          left: calc(66.67% + 20px);
          top: 0;
          bottom: 0;
          width: 1px;
          background: #ddd;
        }

        /* LEFT main column (2/3 of page) */
        .leftMainCol {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-right: 20px;
        }
        .leadText {
          padding-right: 6px;
          margin-bottom: 12px;
        }
        .leadTitle {
          display: block;
          font-size: 36px;
          font-weight: 800;
          line-height: 1.1;
          color: #000;
          margin-bottom: 12px;
          font-family: "Newsreader", serif;
        }
        .leadSummary {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }
        .readMeta {
          margin-top: 8px;
          font-size: 12px;
          color: #888;
        }

        .sectionTabs {
          border-top: 1px solid #333;
          border-bottom: 1px solid #333;
          padding: 12px 0;
          font-size: 13px;
          margin: 12px 0;
        }
        .tabsInner {
          display: flex;
          gap: 14px;
          color: #444;
          flex-wrap: wrap;
        }
        .tabsInner a {
          text-decoration: none;
          color: #444;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        .tabsInner a:hover {
          color: #111;
          background-color: #f5f5f5;
        }
        .kicker {
          font-weight: 700;
          color: #111;
        }

        .leftArticles {
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .leftArticle {
          padding-bottom: 6px;
          border-bottom: 2px solid #333;
        }
        .leftTitle {
          display: block;
          font-weight: 800;
          color: #000;
          margin-bottom: 8px;
          text-decoration: none;
          font-size: 20px;
          line-height: 1.2;
          font-family: "Newsreader", serif;
        }
        .smallSummary {
          color: #777;
          font-size: 13px;
          margin: 0;
        }
        .readTiny {
          font-size: 12px;
          color: #999;
          margin-top: 8px;
        }

        .liveBlock {
          margin-top: 24px;
          border-top: 1px solid #333;
          padding-top: 20px;
        }
        .liveK {
          color: #b00;
          font-weight: 700;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .liveTitle {
          font-weight: 800;
          display: block;
          color: #000;
          text-decoration: none;
          font-size: 20px;
          line-height: 1.2;
          font-family: "Newsreader", serif;
        }

        .heroImage {
          height: 380px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .heroImageInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .heroCaption {
          position: absolute;
          right: 8px;
          bottom: 8px;
          font-size: 12px;
          color: #777;
          background: rgba(255, 255, 255, 0.6);
          padding: 4px 6px;
          border-radius: 2px;
        }

        /* Featured Article Section */
        .featuredArticle {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          margin: 16px 0;
        }
        .featuredImage {
          width: 220px;
          height: 200px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .featuredImageInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .featuredContent {
          flex: 1;
        }
        .featuredTitle {
          display: block;
          font-size: 32px;
          font-weight: 800;
          color: #000;
          text-decoration: none;
          line-height: 1.1;
          margin-bottom: 10px;
          font-family: "Newsreader", serif;
        }
        .featuredSummary {
          color: #666;
          font-size: 14px;
          line-height: 1.4;
          margin: 0 0 8px 0;
        }
        .featuredMeta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #888;
        }
        .author {
          font-weight: 600;
        }

        /* Secondary Articles Grid */
        .secondaryGrid {
          display: flex;
          gap: 32px;
          margin: 16px 0;
        }
        .secondaryArticle {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 180px;
        }
        .secondaryArticle:not(:has(.secondaryImage)) .secondaryContent {
          padding-top: 10px;
        }
        .secondaryImage {
          width: 100%;
          height: 180px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .secondaryImageInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .secondaryContent {
          flex: 1;
        }
        .secondaryTitle {
          display: block;
          font-size: 22px;
          font-weight: 800;
          color: #000;
          text-decoration: none;
          line-height: 1.2;
          margin-bottom: 8px;
          font-family: "Newsreader", serif;
        }
        .secondarySummary {
          color: #666;
          font-size: 13px;
          line-height: 1.4;
          margin: 0;
        }

        /* Additional News Cards Section */
        .additionalNewsCards {
          margin: 32px 0;
          padding-top: 24px;
          border-top: 1px solid #333;
        }
        .newsCardsGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .newsCard {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
        }
        .newsCardImage {
          width: 100%;
          height: 140px;
          background-color: #f8f8f8;
          position: relative;
          overflow: hidden;
        }
        .newsCardImageInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          object-position: center !important;
        }
        .newsCardContent {
          padding: 20px;
        }

        .newsCardTitle {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: #000;
          text-decoration: none;
          line-height: 1.2;
          margin-bottom: 12px;
          font-family: "Newsreader", serif;
        }

        .newsCardSummary {
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }
        .newsCardMeta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #888;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .newsCardAuthor {
          font-weight: 600;
          color: #555;
        }
        .newsCardReadTime {
          color: #999;
        }

        .midRow {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }
        .midLeft {
          flex: 1;
          padding-right: 10px;
        }
        .midTitle {
          font-weight: 700;
          display: block;
          color: #111;
          font-size: 18px;
          text-decoration: none;
          margin-bottom: 8px;
        }
        .midRight {
          width: 200px;
          display: flex;
          gap: 8px;
          flex-direction: row;
        }
        .midImage {
          width: 96px;
          height: 72px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .midImageInner {
          object-fit: cover;
        }

        .thinRule {
          height: 1px;
          background: #333;
          margin: 16px 0;
        }

        .belowGrid {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          margin-top: 12px;
        }
        .belowLeft {
          flex: 1;
          padding-right: 10px;
        }
        .liveLabel {
          color: #b00;
          font-weight: 700;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .belowHeadline {
          font-weight: 700;
          color: #111;
          text-decoration: none;
          display: block;
          font-size: 16px;
          line-height: 1.3;
        }
        .belowRight {
          width: 200px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .smallCard {
          width: 80px;
          height: 60px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .smallCardInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .smallCardText {
          flex: 1;
        }
        .smallCardText a {
          color: #111;
          text-decoration: none;
          display: block;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.3;
        }

        /* RIGHT column */
        .rightCol {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-left: 20px;
        }
        .sideCard {
          border-bottom: 1px solid #333;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .sideImg {
          height: 160px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .sideImgInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .sideTitle {
          display: block;
          font-weight: 800;
          margin-top: 8px;
          color: #000;
          text-decoration: none;
          font-family: "Newsreader", serif;
          font-size: 18px;
          line-height: 1.2;
        }

        .miniGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .miniItem {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .miniImg {
          height: 80px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .miniImgInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .miniTitle {
          color: #000;
          text-decoration: none;
          font-weight: 800;
          font-size: 15px;
          font-family: "Newsreader", serif;
        }

        .opinion {
          padding-top: 20px;
          border-top: 1px solid #333;
          margin-bottom: 24px;
        }
        .opRow {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 8px;
        }
        .opAvatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          flex-shrink: 0;
        }
        .opAuthor {
          font-weight: 700;
          font-size: 13px;
        }
        .opTitle {
          display: block;
          font-weight: 800;
          color: #000;
          text-decoration: none;
          margin-top: 6px;
          font-family: "Newsreader", serif;
          font-size: 18px;
          line-height: 1.2;
        }

        .popular {
          padding-top: 20px;
          border-top: 1px solid #333;
          margin-bottom: 24px;
        }
        .popularList {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .popItem {
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .popImg {
          width: 72px;
          height: 60px;
          background-color: white;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
        }
        .popImgInner {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        .popTitle {
          color: #000;
          text-decoration: none;
          font-size: 15px;
          font-family: "Newsreader", serif;
          font-weight: 800;
        }

        .additionalArticles {
          padding-top: 20px;
          border-top: 1px solid #333;
          margin-bottom: 24px;
        }
        .additionalArticle {
          padding-bottom: 12px;
          border-bottom: 1px solid #ddd;
          margin-bottom: 16px;
        }
        .additionalTitle {
          display: block;
          font-weight: 800;
          color: #000;
          margin-bottom: 6px;
          text-decoration: none;
          font-size: 15px;
          font-family: "Newsreader", serif;
        }

        .subscribe {
          padding-top: 20px;
          border-top: 1px solid #333;
        }
        .cta {
          margin-top: 8px;
          background: #111;
          color: #fff;
          border: 0;
          padding: 10px 12px;
          cursor: pointer;
        }

        .pageFooter {
          margin-top: 40px;
          color: #777;
          font-size: 13px;
          padding: 24px 0;
          border-top: 1px solid #333;
          text-align: center;
        }

        /* responsiveness */
        @media (max-width: 1000px) {
          .gridRoot {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .gridRoot::before {
            display: none;
          }
          .leftMainCol {
            padding-right: 0;
          }
          .rightCol {
            padding-left: 0;
          }
          .heroImage {
            height: 320px;
          }
          .featuredImage {
            width: 180px;
            height: 170px;
          }
          .secondaryGrid {
            gap: 24px;
          }
          .secondaryImage {
            height: 150px;
          }
          .newsCardsGrid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }
        @media (max-width: 800px) {
          .gridRoot {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .gridRoot::before {
            display: none;
          }
          .leftMainCol,
          .rightCol {
            order: initial;
            padding: 0;
          }
          .featuredArticle {
            flex-direction: column;
            gap: 16px;
          }
          .featuredImage {
            width: 100%;
            height: 260px;
          }
          .secondaryGrid {
            flex-direction: column;
            gap: 24px;
          }
          .secondaryImage {
            height: 200px;
          }
          .newsCardsGrid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .newsCardContent {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
