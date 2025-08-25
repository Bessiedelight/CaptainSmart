import SmartNewsPage from "@/components/SmartNewsPage";

export default function SportsPage() {
  return (
    <SmartNewsPage
      title="Sports News"
      description="Get the latest sports updates, match results, player transfers, and sports analysis from Ghana and international competitions."
      iconName="trophy"
      category="Sports"
      searchPlaceholder="Search sports articles..."
      loadingText="Loading sports articles..."
      errorTitle="Unable to load sports articles"
      errorDescription="There was an issue loading the latest sports news content."
      noResultsTitle="No sports articles found"
      noResultsDescription="No sports articles available at the moment"
      loadMoreText="Load More Sports Articles"
      showBackLink={true}
    />
  );
}
