/**
 * Example usage of the enhanced ExposeCard component
 * This demonstrates how to use the ExposeCard with metrics display and view tracking
 */

import ExposeCard from "../ExposeCard";

const ExposeCardExample = () => {
  // Example expose data with metrics
  const sampleExpose = {
    _id: "507f1f77bcf86cd799439011",
    exposeId: "expose_1234567890_abcdef123",
    title: "Breaking: Major Development in Tech Industry",
    description:
      "This is a sample expose post that demonstrates the new metrics functionality. The post includes view tracking, comment counts, and engagement metrics.",
    hashtag: "#technology",
    imageUrls: [
      "/uploads/expose-corner/images/sample1.jpg",
      "/uploads/expose-corner/images/sample2.jpg",
    ],
    audioUrl: "/uploads/expose-corner/audio/sample.mp3",
    upvotes: 42,
    downvotes: 3,
    netVotes: 39,
    timeRemaining: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
    createdAt: new Date().toISOString(),
    // New metrics fields
    views: 1250,
    commentCount: 18,
    shareCount: 7,
  };

  const handleVote = (exposeId: string, voteType: "upvote" | "downvote") => {
    console.log(`Vote ${voteType} for expose ${exposeId}`);
    // In a real implementation, this would call an API to update the vote
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Enhanced ExposeCard Example</h2>
      <p className="text-gray-600 mb-6">
        This example shows the ExposeCard component with the new metrics display
        and view tracking features:
      </p>
      <ul className="list-disc list-inside mb-6 text-gray-600">
        <li>
          View count display with human-readable formatting (1.2K, 2.5M, etc.)
        </li>
        <li>Comment count display showing real comment numbers</li>
        <li>Share count display (when greater than 0)</li>
        <li>Engagement rate calculation</li>
        <li>Automatic view tracking on component mount</li>
        <li>Session-based duplicate view prevention</li>
      </ul>

      <ExposeCard expose={sampleExpose} onVote={handleVote} />

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• View count: {sampleExpose.views.toLocaleString()} views</li>
          <li>• Comment count: {sampleExpose.commentCount} comments</li>
          <li>• Share count: {sampleExpose.shareCount} shares</li>
          <li>
            • Engagement rate:{" "}
            {(
              ((sampleExpose.commentCount +
                sampleExpose.upvotes +
                sampleExpose.downvotes) /
                sampleExpose.views) *
              100
            ).toFixed(1)}
            %
          </li>
          <li>• Automatic view tracking when component mounts</li>
        </ul>
      </div>
    </div>
  );
};

export default ExposeCardExample;
