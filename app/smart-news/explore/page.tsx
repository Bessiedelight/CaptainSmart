import SmartNewsPage from "@/components/SmartNewsPage";

export default function ExplorePage() {
  return (
    <SmartNewsPage
      title="Explore All News"
      description="Discover the latest news from Ghana and beyond. Stay informed with our comprehensive coverage of politics, business, sports, and more."
      iconName="compass"
      showCategories={true}
      searchPlaceholder="Search articles..."
      loadingText="Loading articles..."
      errorTitle="Unable to load articles"
      errorDescription="There was an issue loading the latest news content."
      noResultsTitle="No articles found"
      noResultsDescription="No articles available at the moment"
      loadMoreText="Load More Articles"
    />
  );
}
