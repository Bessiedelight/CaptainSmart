"use client";

import { useState } from "react";
import CommentSection from "@/components/CommentSection";

/**
 * Example usage of CommentSection component
 * This demonstrates how to integrate the CommentSection into an expose post
 */
export default function CommentSectionExample() {
  const [commentCount, setCommentCount] = useState(12);

  const handleCommentCountChange = (newCount: number) => {
    setCommentCount(newCount);
    console.log(`Comment count updated to: ${newCount}`);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Mock Expose Post Content */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">👤</span>
          </div>
          <div>
            <div className="font-bold text-black">Anonymous</div>
            <div className="text-gray-500 text-sm">@anonymous · 2h</div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2">Sample Expose Post Title</h3>

        <p className="text-gray-800 mb-4">
          This is a sample expose post content. The CommentSection component
          will be displayed below this content, allowing users to view and
          interact with comments.
        </p>

        {/* Mock engagement metrics */}
        <div className="flex items-center space-x-6 text-gray-500 text-sm">
          <span>👁️ 1.2K views</span>
          <span>❤️ 45 likes</span>
          <span>💬 {commentCount} comments</span>
        </div>
      </div>

      {/* CommentSection Integration */}
      <CommentSection
        exposeId="expose_example_123"
        initialCommentCount={commentCount}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
}

/**
 * Integration Notes:
 *
 * 1. Place the CommentSection component at the bottom of your expose post card
 * 2. Pass the exposeId from your expose data
 * 3. Pass the initial comment count (can be from your expose data or API)
 * 4. Handle comment count changes to update your UI accordingly
 *
 * Example integration in ExposeCard:
 *
 * Place CommentSection at the bottom of your expose card component.
 * Pass exposeId, initialCommentCount, and onCommentCountChange props.
 * Handle count changes to update your local state or trigger refetch.
 */
