import SmartNewsPage from "@/components/SmartNewsPage";

export default function PoliticsPage() {
  return (
    <SmartNewsPage
      title="Politics News"
      description="Stay informed with the latest political developments, government policies, elections, and political analysis from Ghana and beyond."
      iconName="vote"
      category="Politics"
      searchPlaceholder="Search politics articles..."
      loadingText="Loading politics articles..."
      errorTitle="Unable to load politics articles"
      errorDescription="There was an issue loading the latest political news content."
      noResultsTitle="No politics articles found"
      noResultsDescription="No politics articles available at the moment"
      loadMoreText="Load More Politics Articles"
      showBackLink={true}
    />
  );
}
