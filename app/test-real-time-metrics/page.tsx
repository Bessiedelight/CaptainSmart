"use client";

import { useState } from "react";
import { useRealTimeMetrics } from "@/lib/hooks/useRealTimeMetrics";

const mockExpose = {
  _id: "test123",
  exposeId: "expose_test123",
  title: "Test Real-time Metrics",
  description:
    "This is a test expose to demonstrate real-time metrics functionality.",
  hashtag: "#test",
  imageUrls: [],
  upvotes: 10,
  downvotes: 2,
  netVotes: 8,
  timeRemaining: 86400000, // 24 hours
  createdAt: new Date().toISOString(),
  views: 100,
  commentCount: 5,
  shareCount: 3,
};

export default function TestRealTimeMetricsPage() {
  const [metricsLog, setMetricsLog] = useState<string[]>([]);

  const {
    metrics,
    isUpdating,
    updateVote,
    updateComment,
    updateView,
    updateShare,
    refreshMetrics,
    hasOptimisticUpdates,
  } = useRealTimeMetrics({
    exposeId: mockExpose.exposeId,
    initialMetrics: {
      views: mockExpose.views || 0,
      comments: mockExpose.commentCount || 0,
      upvotes: mockExpose.upvotes || 0,
      downvotes: mockExpose.downvotes || 0,
      netVotes: mockExpose.netVotes || 0,
      shares: mockExpose.shareCount || 0,
    },
    onMetricsChange: (newMetrics) => {
      const logEntry = `${new Date().toLocaleTimeString()}: Metrics updated - ${JSON.stringify(newMetrics)}`;
      setMetricsLog((prev) => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
    },
  });

  const handleUpvote = async () => {
    try {
      await updateVote("upvote");
    } catch (error) {
      console.error("Upvote failed:", error);
    }
  };

  const handleDownvote = async () => {
    try {
      await updateVote("downvote");
    } catch (error) {
      console.error("Downvote failed:", error);
    }
  };

  const handleAddComment = async () => {
    try {
      await updateComment(1);
    } catch (error) {
      console.error("Add comment failed:", error);
    }
  };

  const handleRemoveComment = async () => {
    try {
      await updateComment(-1);
    } catch (error) {
      console.error("Remove comment failed:", error);
    }
  };

  const handleTrackView = async () => {
    try {
      await updateView();
    } catch (error) {
      console.error("Track view failed:", error);
    }
  };

  const handleShare = async () => {
    try {
      await updateShare();
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshMetrics();
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Real-time Metrics Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the real-time metrics functionality with
            optimistic updates, error recovery, and persistence.
          </p>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4 mb-6">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isUpdating
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {isUpdating ? "Updating..." : "Ready"}
            </div>

            {hasOptimisticUpdates && (
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Optimistic Updates Active
              </div>
            )}
          </div>

          {/* Current Metrics Display */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.views}
              </div>
              <div className="text-sm text-gray-600">Views</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.comments}
              </div>
              <div className="text-sm text-gray-600">Comments</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.upvotes}
              </div>
              <div className="text-sm text-gray-600">Upvotes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.downvotes}
              </div>
              <div className="text-sm text-gray-600">Downvotes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.netVotes}
              </div>
              <div className="text-sm text-gray-600">Net Votes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.shares}
              </div>
              <div className="text-sm text-gray-600">Shares</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={handleUpvote}
              disabled={isUpdating}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Upvote
            </button>
            <button
              onClick={handleDownvote}
              disabled={isUpdating}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Downvote
            </button>
            <button
              onClick={handleAddComment}
              disabled={isUpdating}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add Comment
            </button>
            <button
              onClick={handleRemoveComment}
              disabled={isUpdating}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Remove Comment
            </button>
            <button
              onClick={handleTrackView}
              disabled={isUpdating}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Track View
            </button>
            <button
              onClick={handleShare}
              disabled={isUpdating}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Share
            </button>
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Metrics Change Log */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Metrics Change Log
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {metricsLog.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No changes yet. Try clicking the buttons above!
                </p>
              ) : (
                metricsLog.map((entry, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono text-gray-700 bg-white p-2 rounded"
                  >
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              How to Test
            </h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>
                • Click the action buttons to see optimistic updates in
                real-time
              </li>
              <li>
                • Watch the status indicators to see when updates are in
                progress
              </li>
              <li>• Check the metrics change log to see how values update</li>
              <li>• Try refreshing the page to see if metrics persist</li>
              <li>
                • Open browser dev tools to see API calls and error handling
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
