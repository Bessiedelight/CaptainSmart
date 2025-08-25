import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VoteButtons from "@/components/VoteButtons";

describe("VoteButtons Component", () => {
  const defaultProps = {
    exposeId: "expose_123_abc",
    upvotes: 10,
    downvotes: 3,
    netVotes: 7,
    onVote: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render upvote and downvote buttons with counts", () => {
      render(<VoteButtons {...defaultProps} />);

      expect(screen.getByLabelText("Upvote")).toBeInTheDocument();
      expect(screen.getByLabelText("Downvote")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("+7")).toBeInTheDocument();
    });

    it("should render net votes without plus sign when zero", () => {
      const props = { ...defaultProps, upvotes: 5, downvotes: 5, netVotes: 0 };
      render(<VoteButtons {...props} />);

      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.queryByText("+0")).not.toBeInTheDocument();
    });

    it("should render negative net votes correctly", () => {
      const props = { ...defaultProps, upvotes: 2, downvotes: 5, netVotes: -3 };
      render(<VoteButtons {...props} />);

      expect(screen.getByText("-3")).toBeInTheDocument();
    });

    it("should apply correct styling for positive net votes", () => {
      render(<VoteButtons {...defaultProps} />);

      const netVoteElement = screen.getByText("+7");
      expect(netVoteElement).toHaveClass("text-green-600");
    });

    it("should apply correct styling for negative net votes", () => {
      const props = { ...defaultProps, upvotes: 2, downvotes: 5, netVotes: -3 };
      render(<VoteButtons {...props} />);

      const netVoteElement = screen.getByText("-3");
      expect(netVoteElement).toHaveClass("text-red-600");
    });

    it("should apply correct styling for zero net votes", () => {
      const props = { ...defaultProps, upvotes: 5, downvotes: 5, netVotes: 0 };
      render(<VoteButtons {...props} />);

      const netVoteElement = screen.getByText("0");
      expect(netVoteElement).toHaveClass("text-gray-500");
    });
  });

  describe("Size Variants", () => {
    it("should apply small size classes", () => {
      render(<VoteButtons {...defaultProps} size="sm" />);

      const upvoteButton = screen.getByLabelText("Upvote");
      expect(upvoteButton).toHaveClass("p-1");
    });

    it("should apply medium size classes (default)", () => {
      render(<VoteButtons {...defaultProps} size="md" />);

      const upvoteButton = screen.getByLabelText("Upvote");
      expect(upvoteButton).toHaveClass("p-2");
    });

    it("should apply large size classes", () => {
      render(<VoteButtons {...defaultProps} size="lg" />);

      const upvoteButton = screen.getByLabelText("Upvote");
      expect(upvoteButton).toHaveClass("p-3");
    });
  });

  describe("Compact Variant", () => {
    it("should render compact layout", () => {
      render(<VoteButtons {...defaultProps} variant="compact" />);

      // In compact mode, net votes should be displayed differently
      expect(screen.getByText("Net:")).toBeInTheDocument();
      expect(screen.getByText("+7")).toBeInTheDocument();
    });

    it("should have different layout structure in compact mode", () => {
      const { container } = render(
        <VoteButtons {...defaultProps} variant="compact" />
      );

      // Compact variant should have a different flex layout
      const compactContainer = container.querySelector(
        ".flex.items-center.space-x-2"
      );
      expect(compactContainer).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onVote with correct parameters when upvote is clicked", async () => {
      const user = userEvent.setup();
      render(<VoteButtons {...defaultProps} />);

      const upvoteButton = screen.getByLabelText("Upvote");
      await user.click(upvoteButton);

      expect(defaultProps.onVote).toHaveBeenCalledWith(
        "expose_123_abc",
        "upvote"
      );
    });

    it("should call onVote with correct parameters when downvote is clicked", async () => {
      const user = userEvent.setup();
      render(<VoteButtons {...defaultProps} />);

      const downvoteButton = screen.getByLabelText("Downvote");
      await user.click(downvoteButton);

      expect(defaultProps.onVote).toHaveBeenCalledWith(
        "expose_123_abc",
        "downvote"
      );
    });

    it("should not call onVote when buttons are disabled", async () => {
      const user = userEvent.setup();
      render(<VoteButtons {...defaultProps} disabled={true} />);

      const upvoteButton = screen.getByLabelText("Upvote");
      const downvoteButton = screen.getByLabelText("Downvote");

      await user.click(upvoteButton);
      await user.click(downvoteButton);

      expect(defaultProps.onVote).not.toHaveBeenCalled();
    });

    it("should disable buttons and show loading state during voting", async () => {
      const slowOnVote = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );
      const user = userEvent.setup();

      render(<VoteButtons {...defaultProps} onVote={slowOnVote} />);

      const upvoteButton = screen.getByLabelText("Upvote");

      // Click the button
      await user.click(upvoteButton);

      // Button should be disabled and show loading state
      expect(upvoteButton).toBeDisabled();
      expect(upvoteButton).toHaveClass("animate-pulse");

      // Wait for the vote to complete
      await waitFor(() => {
        expect(upvoteButton).not.toBeDisabled();
      });
    });
  });

  describe("Optimistic Updates", () => {
    it("should show optimistic update for upvote", async () => {
      const user = userEvent.setup();
      const slowOnVote = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

      render(<VoteButtons {...defaultProps} onVote={slowOnVote} />);

      const upvoteButton = screen.getByLabelText("Upvote");

      // Initial state
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("+7")).toBeInTheDocument();

      // Click upvote
      await user.click(upvoteButton);

      // Should show optimistic update immediately
      expect(screen.getByText("11")).toBeInTheDocument();
      expect(screen.getByText("+8")).toBeInTheDocument();
    });

    it("should show optimistic update for downvote", async () => {
      const user = userEvent.setup();
      const slowOnVote = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

      render(<VoteButtons {...defaultProps} onVote={slowOnVote} />);

      const downvoteButton = screen.getByLabelText("Downvote");

      // Initial state
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("+7")).toBeInTheDocument();

      // Click downvote
      await user.click(downvoteButton);

      // Should show optimistic update immediately
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("+6")).toBeInTheDocument();
    });

    it("should revert optimistic update on error", async () => {
      const user = userEvent.setup();
      const failingOnVote = vi.fn().mockRejectedValue(new Error("Vote failed"));

      render(<VoteButtons {...defaultProps} onVote={failingOnVote} />);

      const upvoteButton = screen.getByLabelText("Upvote");

      // Initial state
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("+7")).toBeInTheDocument();

      // Click upvote
      await user.click(upvoteButton);

      // Should show optimistic update immediately
      expect(screen.getByText("11")).toBeInTheDocument();

      // Wait for error and revert
      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText("+7")).toBeInTheDocument();
      });
    });

    it("should update optimistic votes when props change", () => {
      const { rerender } = render(<VoteButtons {...defaultProps} />);

      // Initial render
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();

      // Update props (simulating successful API response)
      const updatedProps = {
        ...defaultProps,
        upvotes: 11,
        downvotes: 3,
        netVotes: 8,
      };
      rerender(<VoteButtons {...updatedProps} />);

      // Should show updated values
      expect(screen.getByText("11")).toBeInTheDocument();
      expect(screen.getByText("+8")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle different error types with appropriate messages", async () => {
      const user = userEvent.setup();
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const errorOnVote = vi.fn().mockRejectedValue(
        new Error(
          JSON.stringify({
            code: "EXPOSE_NOT_FOUND_OR_EXPIRED",
            message: "Expose not found",
          })
        )
      );

      render(<VoteButtons {...defaultProps} onVote={errorOnVote} />);

      const upvoteButton = screen.getByLabelText("Upvote");
      await user.click(upvoteButton);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Vote error for user:",
          "This content has expired"
        );
      });

      consoleWarnSpy.mockRestore();
    });

    it("should handle network errors", async () => {
      const user = userEvent.setup();
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const errorOnVote = vi.fn().mockRejectedValue(
        new Error(
          JSON.stringify({
            code: "NETWORK_ERROR",
            message: "Network failed",
          })
        )
      );

      render(<VoteButtons {...defaultProps} onVote={errorOnVote} />);

      const upvoteButton = screen.getByLabelText("Upvote");
      await user.click(upvoteButton);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Vote error for user:",
          "Connection error, please try again"
        );
      });

      consoleWarnSpy.mockRestore();
    });

    it("should handle generic errors", async () => {
      const user = userEvent.setup();
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const errorOnVote = vi.fn().mockRejectedValue(new Error("Generic error"));

      render(<VoteButtons {...defaultProps} onVote={errorOnVote} />);

      const upvoteButton = screen.getByLabelText("Upvote");
      await user.click(upvoteButton);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          "Vote error for user:",
          "Generic error"
        );
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<VoteButtons {...defaultProps} />);

      expect(screen.getByLabelText("Upvote")).toBeInTheDocument();
      expect(screen.getByLabelText("Downvote")).toBeInTheDocument();
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      render(<VoteButtons {...defaultProps} />);

      const upvoteButton = screen.getByLabelText("Upvote");

      // Focus the button
      await user.tab();
      expect(upvoteButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard("{Enter}");
      expect(defaultProps.onVote).toHaveBeenCalledWith(
        "expose_123_abc",
        "upvote"
      );
    });

    it("should indicate disabled state to screen readers", () => {
      render(<VoteButtons {...defaultProps} disabled={true} />);

      const upvoteButton = screen.getByLabelText("Upvote");
      const downvoteButton = screen.getByLabelText("Downvote");

      expect(upvoteButton).toBeDisabled();
      expect(downvoteButton).toBeDisabled();
    });
  });
});
