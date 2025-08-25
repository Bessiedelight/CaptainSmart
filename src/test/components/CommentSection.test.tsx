import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CommentSection from "@/components/CommentSection";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("CommentSection", () => {
  const defaultProps = {
    exposeId: "expose_123",
    initialCommentCount: 5,
    onCommentCountChange: vi.fn(),
  };

  beforeEach(() => {
    mockFetch.mockClear();
    defaultProps.onCommentCountChange.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders comment section header with correct count", () => {
    render(<CommentSection {...defaultProps} />);

    expect(screen.getByText("5 comments")).toBeInTheDocument();
    expect(screen.getByLabelText("Show comments")).toBeInTheDocument();
  });

  it("renders singular comment text for count of 1", () => {
    render(<CommentSection {...defaultProps} initialCommentCount={1} />);

    expect(screen.getByText("1 comment")).toBeInTheDocument();
  });

  it("renders no comments text for count of 0", () => {
    render(<CommentSection {...defaultProps} initialCommentCount={0} />);

    expect(screen.getByText("No comments yet")).toBeInTheDocument();
  });

  it("expands and collapses comment section", () => {
    render(<CommentSection {...defaultProps} />);

    const toggleButton = screen.getByLabelText("Show comments");

    // Initially collapsed
    expect(screen.queryByText("Loading comments...")).not.toBeInTheDocument();

    // Expand
    fireEvent.click(toggleButton);
    expect(screen.getByLabelText("Hide comments")).toBeInTheDocument();
  });

  it("fetches comments when expanded", async () => {
    const mockComments = [
      {
        _id: "comment1",
        commentId: "comment_1",
        exposeId: "expose_123",
        content: "This is a test comment",
        anonymousId: "anon_1234567890abcdef",
        timeAgo: "2h",
        createdAt: "2024-01-01T10:00:00Z",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          comments: mockComments,
          pagination: {
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
          },
          exposeId: "expose_123",
        },
      }),
    });

    render(<CommentSection {...defaultProps} />);

    // Expand section
    fireEvent.click(screen.getByLabelText("Show comments"));

    // Should show loading state
    expect(screen.getByText("Loading comments...")).toBeInTheDocument();

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText("This is a test comment")).toBeInTheDocument();
    });

    expect(screen.getByText("Anonymous cdef")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<CommentSection {...defaultProps} />);

    // Expand section
    fireEvent.click(screen.getByLabelText("Show comments"));

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText("Failed to load comments")).toBeInTheDocument();
    });

    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("handles server errors with appropriate messages", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<CommentSection {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Show comments"));

    await waitFor(() => {
      expect(
        screen.getByText("Server temporarily unavailable.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no comments exist", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          comments: [],
          pagination: {
            total: 0,
            limit: 10,
            offset: 0,
            hasMore: false,
          },
          exposeId: "expose_123",
        },
      }),
    });

    render(<CommentSection {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Show comments"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "No comments yet. Be the first to share your thoughts!"
        )
      ).toBeInTheDocument();
    });
  });

  it("loads more comments when load more button is clicked", async () => {
    const initialComments = [
      {
        _id: "comment1",
        commentId: "comment_1",
        exposeId: "expose_123",
        content: "First comment",
        anonymousId: "anon_1234567890abcdef",
        timeAgo: "2h",
        createdAt: "2024-01-01T10:00:00Z",
      },
    ];

    const additionalComments = [
      {
        _id: "comment2",
        commentId: "comment_2",
        exposeId: "expose_123",
        content: "Second comment",
        anonymousId: "anon_abcdef1234567890",
        timeAgo: "1h",
        createdAt: "2024-01-01T11:00:00Z",
      },
    ];

    // First fetch - initial comments
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          comments: initialComments,
          pagination: {
            total: 2,
            limit: 1,
            offset: 0,
            hasMore: true,
          },
          exposeId: "expose_123",
        },
      }),
    });

    render(<CommentSection {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Show comments"));

    await waitFor(() => {
      expect(screen.getByText("First comment")).toBeInTheDocument();
    });

    // Second fetch - load more
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          comments: additionalComments,
          pagination: {
            total: 2,
            limit: 1,
            offset: 1,
            hasMore: false,
          },
          exposeId: "expose_123",
        },
      }),
    });

    const loadMoreButton = screen.getByText("Load more comments (1 remaining)");
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText("Second comment")).toBeInTheDocument();
    });

    // Both comments should be visible
    expect(screen.getByText("First comment")).toBeInTheDocument();
    expect(screen.getByText("Second comment")).toBeInTheDocument();
  });

  it("calls onCommentCountChange when actual count differs from initial", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          comments: [],
          pagination: {
            total: 3, // Different from initial count of 5
            limit: 10,
            offset: 0,
            hasMore: false,
          },
          exposeId: "expose_123",
        },
      }),
    });

    render(<CommentSection {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Show comments"));

    await waitFor(() => {
      expect(defaultProps.onCommentCountChange).toHaveBeenCalledWith(3);
    });
  });

  it("formats anonymous display names correctly", async () => {
    const mockComments = [
      {
        _id: "comment1",
        commentId: "comment_1",
        exposeId: "expose_123",
        content: "Test comment",
        anonymousId: "anon_1234567890abcdef",
        timeAgo: "1h",
        createdAt: "2024-01-01T10:00:00Z",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          comments: mockComments,
          pagination: {
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
          },
          exposeId: "expose_123",
        },
      }),
    });

    render(<CommentSection {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Show comments"));

    await waitFor(() => {
      expect(screen.getByText("Anonymous cdef")).toBeInTheDocument();
    });
  });
});
