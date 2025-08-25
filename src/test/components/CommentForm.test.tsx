import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CommentForm from "@/components/CommentForm";

describe("CommentForm Component", () => {
  it("renders successfully", () => {
    const mockOnCommentSubmit = vi.fn();

    render(
      <CommentForm
        exposeId="test_expose_123"
        onCommentSubmit={mockOnCommentSubmit}
      />
    );

    // Check that key elements are rendered
    expect(screen.getByText("Add a comment")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("What are your thoughts on this?")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByText("0/500")).toBeInTheDocument();
  });
});
