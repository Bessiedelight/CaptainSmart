import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExposeForm from "@/components/ExposeForm";
import { PREDEFINED_HASHTAGS } from "@/lib/constants";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "mock-object-url");
global.URL.revokeObjectURL = vi.fn();

describe("ExposeForm Component", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(<ExposeForm {...defaultProps} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hashtag/i)).toBeInTheDocument();
      expect(screen.getByText(/images \(optional\)/i)).toBeInTheDocument();
      expect(
        screen.getByText(/audio recording \(optional\)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /publish exposé/i })
      ).toBeInTheDocument();
    });

    it("should show character counts for title and description", () => {
      render(<ExposeForm {...defaultProps} />);

      expect(screen.getByText("0/200 characters")).toBeInTheDocument();
      expect(screen.getByText("0/2000 characters")).toBeInTheDocument();
    });

    it("should render predefined hashtag options", () => {
      render(<ExposeForm {...defaultProps} />);

      const hashtagSelect = screen.getByDisplayValue("");
      fireEvent.click(hashtagSelect);

      PREDEFINED_HASHTAGS.forEach((hashtag) => {
        expect(screen.getByText(hashtag)).toBeInTheDocument();
      });
    });

    it("should show custom hashtag input when requested", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const customHashtagButton = screen.getByText(/create a custom hashtag/i);
      await user.click(customHashtagButton);

      expect(
        screen.getByPlaceholderText("#your_custom_hashtag")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/choose from predefined hashtags/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show validation errors for empty required fields", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Title is required")).toBeInTheDocument();
      expect(screen.getByText("Description is required")).toBeInTheDocument();
      expect(screen.getByText("Hashtag is required")).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it("should show validation error for title too long", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "a".repeat(201));

      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Title must be 200 characters or less")
      ).toBeInTheDocument();
    });

    it("should show validation error for description too long", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, "a".repeat(2001));

      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Description must be 2000 characters or less")
      ).toBeInTheDocument();
    });

    it("should validate custom hashtag format", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      // Switch to custom hashtag
      const customHashtagButton = screen.getByText(/create a custom hashtag/i);
      await user.click(customHashtagButton);

      // Enter invalid hashtag
      const customHashtagInput = screen.getByPlaceholderText(
        "#your_custom_hashtag"
      );
      await user.type(customHashtagInput, "invalid");

      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Custom hashtag must start with #")
      ).toBeInTheDocument();
    });

    it("should validate custom hashtag length", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      // Switch to custom hashtag
      const customHashtagButton = screen.getByText(/create a custom hashtag/i);
      await user.click(customHashtagButton);

      // Enter hashtag that's too long
      const customHashtagInput = screen.getByPlaceholderText(
        "#your_custom_hashtag"
      );
      await user.type(customHashtagInput, "#" + "a".repeat(50));

      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Hashtag must be between 2-50 characters")
      ).toBeInTheDocument();
    });

    it("should update character counts as user types", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test title");

      expect(screen.getByText("10/200 characters")).toBeInTheDocument();

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, "Test description");

      expect(screen.getByText("16/2000 characters")).toBeInTheDocument();
    });
  });

  describe("Image Upload", () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      return new File(["mock content"], name, {
        type,
        lastModified: Date.now(),
      });
    };

    it("should handle image file selection", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const imageUploadButton = screen.getByText(/click to upload images/i);
      const fileInput = screen.getByDisplayValue(""); // Hidden file input

      const mockFile = createMockFile("test.jpg", "image/jpeg", 1024);

      await user.upload(fileInput, mockFile);

      // Should show image preview
      await waitFor(() => {
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument();
      });
    });

    it("should show error for too many images", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const fileInput = screen.getByDisplayValue(""); // Hidden file input

      // Upload 6 images (exceeds limit of 5)
      const mockFiles = Array.from({ length: 6 }, (_, i) =>
        createMockFile(`test${i}.jpg`, "image/jpeg", 1024)
      );

      await user.upload(fileInput, mockFiles);

      expect(screen.getByText("Maximum 5 images allowed")).toBeInTheDocument();
    });

    it("should show error for invalid file type", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const fileInput = screen.getByDisplayValue(""); // Hidden file input

      const mockFile = createMockFile("test.txt", "text/plain", 1024);

      await user.upload(fileInput, mockFile);

      expect(
        screen.getByText("Only image files are allowed")
      ).toBeInTheDocument();
    });

    it("should show error for file too large", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const fileInput = screen.getByDisplayValue(""); // Hidden file input

      const mockFile = createMockFile(
        "large.jpg",
        "image/jpeg",
        6 * 1024 * 1024
      ); // 6MB

      await user.upload(fileInput, mockFile);

      expect(
        screen.getByText("Each image must be 5MB or less")
      ).toBeInTheDocument();
    });

    it("should allow removing uploaded images", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const fileInput = screen.getByDisplayValue(""); // Hidden file input

      const mockFile = createMockFile("test.jpg", "image/jpeg", 1024);

      await user.upload(fileInput, mockFile);

      // Wait for preview to appear
      await waitFor(() => {
        expect(screen.getByAltText("Preview 1")).toBeInTheDocument();
      });

      // Find and click remove button
      const removeButton = screen.getByRole("button", { name: "" }); // X button
      await user.click(removeButton);

      // Preview should be removed
      expect(screen.queryByAltText("Preview 1")).not.toBeInTheDocument();
    });
  });

  describe("Audio Upload", () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      return new File(["mock content"], name, {
        type,
        lastModified: Date.now(),
      });
    };

    it("should handle audio file selection", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const audioUploadButton = screen.getByText(/click to upload audio/i);

      // Find the hidden audio input
      const audioInputs = screen.getAllByDisplayValue("");
      const audioInput = audioInputs.find(
        (input) => input.getAttribute("accept") === "audio/*"
      );

      const mockFile = createMockFile("test.mp3", "audio/mpeg", 1024);

      await user.upload(audioInput!, mockFile);

      // Should show audio file name
      await waitFor(() => {
        expect(screen.getByText("test.mp3")).toBeInTheDocument();
      });
    });

    it("should show error for invalid audio file type", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const audioInputs = screen.getAllByDisplayValue("");
      const audioInput = audioInputs.find(
        (input) => input.getAttribute("accept") === "audio/*"
      );

      const mockFile = createMockFile("test.txt", "text/plain", 1024);

      await user.upload(audioInput!, mockFile);

      expect(
        screen.getByText("Only audio files are allowed")
      ).toBeInTheDocument();
    });

    it("should show error for audio file too large", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const audioInputs = screen.getAllByDisplayValue("");
      const audioInput = audioInputs.find(
        (input) => input.getAttribute("accept") === "audio/*"
      );

      const mockFile = createMockFile(
        "large.mp3",
        "audio/mpeg",
        11 * 1024 * 1024
      ); // 11MB

      await user.upload(audioInput!, mockFile);

      expect(
        screen.getByText("Audio file must be 10MB or less")
      ).toBeInTheDocument();
    });

    it("should allow removing uploaded audio", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const audioInputs = screen.getAllByDisplayValue("");
      const audioInput = audioInputs.find(
        (input) => input.getAttribute("accept") === "audio/*"
      );

      const mockFile = createMockFile("test.mp3", "audio/mpeg", 1024);

      await user.upload(audioInput!, mockFile);

      // Wait for file to appear
      await waitFor(() => {
        expect(screen.getByText("test.mp3")).toBeInTheDocument();
      });

      // Find and click remove button
      const removeButtons = screen.getAllByRole("button", { name: "" });
      const audioRemoveButton = removeButtons.find((button) =>
        button.closest("div")?.textContent?.includes("test.mp3")
      );

      await user.click(audioRemoveButton!);

      // Audio file should be removed
      expect(screen.queryByText("test.mp3")).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      // Fill in required fields
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(
        screen.getByLabelText(/description/i),
        "Test Description"
      );

      // Select hashtag
      const hashtagSelect = screen.getByDisplayValue("");
      await user.selectOptions(hashtagSelect, "#corruption");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        title: "Test Title",
        description: "Test Description",
        hashtag: "#corruption",
        imageFiles: [],
        audioFile: undefined,
      });
    });

    it("should submit form with custom hashtag", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      // Fill in required fields
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(
        screen.getByLabelText(/description/i),
        "Test Description"
      );

      // Switch to custom hashtag
      const customHashtagButton = screen.getByText(/create a custom hashtag/i);
      await user.click(customHashtagButton);

      // Enter custom hashtag
      const customHashtagInput = screen.getByPlaceholderText(
        "#your_custom_hashtag"
      );
      await user.type(customHashtagInput, "#custom_tag");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        title: "Test Title",
        description: "Test Description",
        hashtag: "#custom_tag",
        imageFiles: [],
        audioFile: undefined,
      });
    });

    it("should reset form after successful submission", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<ExposeForm onSubmit={onSubmit} />);

      // Fill in form
      await user.type(screen.getByLabelText(/title/i), "Test Title");
      await user.type(
        screen.getByLabelText(/description/i),
        "Test Description"
      );

      const hashtagSelect = screen.getByDisplayValue("");
      await user.selectOptions(hashtagSelect, "#corruption");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      // Wait for form to reset
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue("");
        expect(screen.getByLabelText(/description/i)).toHaveValue("");
        expect(screen.getByDisplayValue("")).toBeInTheDocument();
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByRole("button", {
        name: /publishing.../i,
      });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Publishing...")).toBeInTheDocument();
    });

    it("should disable form fields during submission", () => {
      render(<ExposeForm {...defaultProps} isSubmitting={true} />);

      expect(screen.getByLabelText(/title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByDisplayValue("")).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all form fields", () => {
      render(<ExposeForm {...defaultProps} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hashtag/i)).toBeInTheDocument();
    });

    it("should show validation errors with proper ARIA attributes", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /publish exposé/i,
      });
      await user.click(submitButton);

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass("border-red-500");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<ExposeForm {...defaultProps} />);

      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/title/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByDisplayValue("")).toHaveFocus();
    });
  });
});
