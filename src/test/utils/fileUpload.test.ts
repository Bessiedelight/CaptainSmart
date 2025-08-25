import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  validateFile,
  validateFiles,
  generateUniqueFilename,
  saveUploadedFile,
  deleteUploadedFile,
  cleanupExpiredFiles,
  sanitizeFilename,
  FILE_CONSTRAINTS,
} from "@/lib/utils/fileUpload";

// Mock fs promises
vi.mock("fs/promises", () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
}));

// Mock fs sync methods
vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

// Mock process.cwd
vi.mock("process", () => ({
  cwd: vi.fn(() => "/mock/project/root"),
}));

describe("File Upload Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FILE_CONSTRAINTS", () => {
    it("should have correct image constraints", () => {
      expect(FILE_CONSTRAINTS.images.maxFiles).toBe(5);
      expect(FILE_CONSTRAINTS.images.maxSize).toBe(5 * 1024 * 1024);
      expect(FILE_CONSTRAINTS.images.allowedTypes).toContain("image/jpeg");
      expect(FILE_CONSTRAINTS.images.allowedTypes).toContain("image/png");
      expect(FILE_CONSTRAINTS.images.allowedExtensions).toContain(".jpg");
      expect(FILE_CONSTRAINTS.images.allowedExtensions).toContain(".png");
    });

    it("should have correct audio constraints", () => {
      expect(FILE_CONSTRAINTS.audio.maxFiles).toBe(1);
      expect(FILE_CONSTRAINTS.audio.maxSize).toBe(10 * 1024 * 1024);
      expect(FILE_CONSTRAINTS.audio.allowedTypes).toContain("audio/mpeg");
      expect(FILE_CONSTRAINTS.audio.allowedTypes).toContain("audio/wav");
      expect(FILE_CONSTRAINTS.audio.allowedExtensions).toContain(".mp3");
      expect(FILE_CONSTRAINTS.audio.allowedExtensions).toContain(".wav");
    });

    it("should have correct total size constraint", () => {
      expect(FILE_CONSTRAINTS.totalMaxSize).toBe(30 * 1024 * 1024);
    });
  });

  describe("validateFile", () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      return {
        name,
        type,
        size,
        arrayBuffer: vi.fn(),
        slice: vi.fn(),
        stream: vi.fn(),
        text: vi.fn(),
        lastModified: Date.now(),
        webkitRelativePath: "",
      } as unknown as File;
    };

    it("should validate a valid image file", () => {
      const file = createMockFile("test.jpg", "image/jpeg", 1024 * 1024); // 1MB
      const result = validateFile(file, "image");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate a valid audio file", () => {
      const file = createMockFile("test.mp3", "audio/mpeg", 5 * 1024 * 1024); // 5MB
      const result = validateFile(file, "audio");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject image file that is too large", () => {
      const file = createMockFile("large.jpg", "image/jpeg", 6 * 1024 * 1024); // 6MB
      const result = validateFile(file, "image");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File size exceeds 5MB limit");
    });

    it("should reject audio file that is too large", () => {
      const file = createMockFile("large.mp3", "audio/mpeg", 11 * 1024 * 1024); // 11MB
      const result = validateFile(file, "audio");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File size exceeds 10MB limit");
    });

    it("should reject invalid image file type", () => {
      const file = createMockFile("test.txt", "text/plain", 1024);
      const result = validateFile(file, "image");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File type text/plain is not allowed");
    });

    it("should reject invalid audio file type", () => {
      const file = createMockFile("test.txt", "text/plain", 1024);
      const result = validateFile(file, "audio");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File type text/plain is not allowed");
    });

    it("should reject file with invalid extension", () => {
      const file = createMockFile("test.gif", "image/gif", 1024);
      const result = validateFile(file, "image");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File extension .gif is not allowed");
    });

    it("should handle files with uppercase extensions", () => {
      const file = createMockFile("test.JPG", "image/jpeg", 1024);
      const result = validateFile(file, "image");

      expect(result.isValid).toBe(true);
    });
  });

  describe("validateFiles", () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      return {
        name,
        type,
        size,
        arrayBuffer: vi.fn(),
        slice: vi.fn(),
        stream: vi.fn(),
        text: vi.fn(),
        lastModified: Date.now(),
        webkitRelativePath: "",
      } as unknown as File;
    };

    it("should validate valid image and audio files", () => {
      const imageFiles = [
        createMockFile("image1.jpg", "image/jpeg", 1024 * 1024),
        createMockFile("image2.png", "image/png", 2 * 1024 * 1024),
      ];
      const audioFiles = [
        createMockFile("audio.mp3", "audio/mpeg", 5 * 1024 * 1024),
      ];

      const result = validateFiles(imageFiles, audioFiles);
      expect(result.isValid).toBe(true);
    });

    it("should reject too many image files", () => {
      const imageFiles = Array.from({ length: 6 }, (_, i) =>
        createMockFile(`image${i}.jpg`, "image/jpeg", 1024 * 1024)
      );
      const audioFiles: File[] = [];

      const result = validateFiles(imageFiles, audioFiles);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Maximum 5 images allowed");
    });

    it("should reject too many audio files", () => {
      const imageFiles: File[] = [];
      const audioFiles = [
        createMockFile("audio1.mp3", "audio/mpeg", 1024 * 1024),
        createMockFile("audio2.mp3", "audio/mpeg", 1024 * 1024),
      ];

      const result = validateFiles(imageFiles, audioFiles);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Maximum 1 audio file allowed");
    });

    it("should reject when total size exceeds limit", () => {
      const imageFiles = Array.from(
        { length: 5 },
        (_, i) => createMockFile(`image${i}.jpg`, "image/jpeg", 5 * 1024 * 1024) // 5MB each
      );
      const audioFiles = [
        createMockFile("audio.mp3", "audio/mpeg", 10 * 1024 * 1024), // 10MB
      ];

      const result = validateFiles(imageFiles, audioFiles);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Total file size exceeds 30MB limit");
    });

    it("should reject invalid individual files", () => {
      const imageFiles = [createMockFile("invalid.txt", "text/plain", 1024)];
      const audioFiles: File[] = [];

      const result = validateFiles(imageFiles, audioFiles);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File type text/plain is not allowed");
    });
  });

  describe("generateUniqueFilename", () => {
    it("should generate unique filename with timestamp and random string", () => {
      const originalName = "test.jpg";
      const filename1 = generateUniqueFilename(originalName);
      const filename2 = generateUniqueFilename(originalName);

      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/^\d+_[a-z0-9]{6}\.jpg$/);
      expect(filename2).toMatch(/^\d+_[a-z0-9]{6}\.jpg$/);
    });

    it("should preserve file extension", () => {
      const filename = generateUniqueFilename("document.pdf");
      expect(filename).toMatch(/\.pdf$/);
    });

    it("should handle files without extension", () => {
      const filename = generateUniqueFilename("README");
      expect(filename).toMatch(/^\d+_[a-z0-9]{6}$/);
    });
  });

  describe("saveUploadedFile", () => {
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    } as unknown as File;

    beforeEach(() => {
      const { existsSync } = require("fs");
      existsSync.mockReturnValue(false);
    });

    it("should save image file to correct directory", async () => {
      const result = await saveUploadedFile(mockFile, "images");

      expect(fs.mkdir).toHaveBeenCalledWith(
        "/mock/project/root/public/uploads/expose-corner/images",
        { recursive: true }
      );
      expect(fs.writeFile).toHaveBeenCalled();
      expect(result.filename).toMatch(/^\d+_[a-z0-9]{6}\.jpg$/);
      expect(result.url).toMatch(
        /^\/uploads\/expose-corner\/images\/\d+_[a-z0-9]{6}\.jpg$/
      );
      expect(result.size).toBe(1024);
      expect(result.type).toBe("image/jpeg");
    });

    it("should save audio file to correct directory", async () => {
      const audioFile = {
        ...mockFile,
        name: "test.mp3",
        type: "audio/mpeg",
      } as unknown as File;

      const result = await saveUploadedFile(audioFile, "audio");

      expect(fs.mkdir).toHaveBeenCalledWith(
        "/mock/project/root/public/uploads/expose-corner/audio",
        { recursive: true }
      );
      expect(result.url).toMatch(
        /^\/uploads\/expose-corner\/audio\/\d+_[a-z0-9]{6}\.mp3$/
      );
    });

    it("should not create directory if it already exists", async () => {
      const { existsSync } = require("fs");
      existsSync.mockReturnValue(true);

      await saveUploadedFile(mockFile, "images");

      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe("deleteUploadedFile", () => {
    beforeEach(() => {
      const { existsSync } = require("fs");
      existsSync.mockReturnValue(true);
    });

    it("should delete existing file", async () => {
      const fileUrl = "/uploads/expose-corner/images/test.jpg";

      await deleteUploadedFile(fileUrl);

      expect(fs.unlink).toHaveBeenCalledWith(
        "/mock/project/root/public/uploads/expose-corner/images/test.jpg"
      );
    });

    it("should not throw error if file does not exist", async () => {
      const { existsSync } = require("fs");
      existsSync.mockReturnValue(false);

      await expect(
        deleteUploadedFile("/uploads/nonexistent.jpg")
      ).resolves.not.toThrow();
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it("should not throw error if deletion fails", async () => {
      vi.mocked(fs.unlink).mockRejectedValue(new Error("Permission denied"));

      await expect(
        deleteUploadedFile("/uploads/test.jpg")
      ).resolves.not.toThrow();
    });
  });

  describe("cleanupExpiredFiles", () => {
    it("should delete all provided files", async () => {
      const imageUrls = [
        "/uploads/expose-corner/images/image1.jpg",
        "/uploads/expose-corner/images/image2.png",
      ];
      const audioUrl = "/uploads/expose-corner/audio/audio.mp3";

      await cleanupExpiredFiles(imageUrls, audioUrl);

      expect(fs.unlink).toHaveBeenCalledTimes(3);
    });

    it("should handle cleanup without audio file", async () => {
      const imageUrls = ["/uploads/expose-corner/images/image1.jpg"];

      await cleanupExpiredFiles(imageUrls);

      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    it("should not fail if some files cannot be deleted", async () => {
      vi.mocked(fs.unlink).mockRejectedValue(new Error("File not found"));

      const imageUrls = ["/uploads/test1.jpg", "/uploads/test2.jpg"];

      await expect(cleanupExpiredFiles(imageUrls)).resolves.not.toThrow();
    });
  });

  describe("sanitizeFilename", () => {
    it("should replace special characters with underscores", () => {
      const filename = "test file@#$%.jpg";
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toBe("test_file____%.jpg");
    });

    it("should remove leading and trailing dots", () => {
      const filename = "...test.file...";
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toBe("test.file");
    });

    it("should replace multiple dots with single dot", () => {
      const filename = "test...file.jpg";
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toBe("test.file.jpg");
    });

    it("should limit filename length to 100 characters", () => {
      const longFilename = "a".repeat(150) + ".jpg";
      const sanitized = sanitizeFilename(longFilename);

      expect(sanitized.length).toBe(100);
    });

    it("should preserve valid characters", () => {
      const filename = "valid-file_name123.jpg";
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toBe("valid-file_name123.jpg");
    });
  });
});
