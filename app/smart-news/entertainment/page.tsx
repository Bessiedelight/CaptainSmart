import SmartNewsPage from "@/components/SmartNewsPage";

export default function EntertainmentPage() {
  return (
    <SmartNewsPage
      title="Entertainment News"
      description="Discover the latest in entertainment, music, movies, celebrities, and cultural events from Ghana and around the world."
      iconName="music"
      category="Entertainment"
      searchPlaceholder="Search entertainment articles..."
      loadingText="Loading entertainment articles..."
      errorTitle="Unable to load entertainment articles"
      errorDescription="There was an issue loading the latest entertainment news content."
      noResultsTitle="No entertainment articles found"
      noResultsDescription="No entertainment articles available at the moment"
      loadMoreText="Load More Entertainment Articles"
      showBackLink={true}
    />
  );
}
