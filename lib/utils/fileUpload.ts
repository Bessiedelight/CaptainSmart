import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// File upload constraints
export const FILE_CONSTRAINTS = {
  images: {
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB per file
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
  },
  audio: {
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/x-m4a",
    ],
    allowedExtensions: [".mp3", ".wav", ".m4a"],
  },
  totalMaxSize: 30 * 1024 * 1024, // 30MB total per expose
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  type: string;
}

/**
 * Validates file type and size constraints
 */
export function validateFile(
  file: File,
  fileType: "image" | "audio"
): FileValidationResult {
  const constraints =
    FILE_CONSTRAINTS[fileType === "image" ? "images" : "audio"];

  // Check file size
  if (file.size > constraints.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${constraints.maxSize / (1024 * 1024)}MB limit`,
    };
  }

  // Check file type
  if (!constraints.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${constraints.allowedExtensions.join(", ")}`,
    };
  }

  // Check file extension
  const extension = path.extname(file.name).toLowerCase();
  if (!constraints.allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not allowed. Allowed extensions: ${constraints.allowedExtensions.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates multiple files and total size
 */
export function validateFiles(
  imageFiles: File[],
  audioFiles: File[]
): FileValidationResult {
  // Check number of image files
  if (imageFiles.length > FILE_CONSTRAINTS.images.maxFiles) {
    return {
      isValid: false,
      error: `Maximum ${FILE_CONSTRAINTS.images.maxFiles} images allowed`,
    };
  }

  // Check number of audio files
  if (audioFiles.length > FILE_CONSTRAINTS.audio.maxFiles) {
    return {
      isValid: false,
      error: `Maximum ${FILE_CONSTRAINTS.audio.maxFiles} audio file allowed`,
    };
  }

  // Validate individual image files
  for (const file of imageFiles) {
    const validation = validateFile(file, "image");
    if (!validation.isValid) {
      return validation;
    }
  }

  // Validate individual audio files
  for (const file of audioFiles) {
    const validation = validateFile(file, "audio");
    if (!validation.isValid) {
      return validation;
    }
  }

  // Check total size
  const totalSize = [...imageFiles, ...audioFiles].reduce(
    (sum, file) => sum + file.size,
    0
  );
  if (totalSize > FILE_CONSTRAINTS.totalMaxSize) {
    return {
      isValid: false,
      error: `Total file size exceeds ${FILE_CONSTRAINTS.totalMaxSize / (1024 * 1024)}MB limit`,
    };
  }

  return { isValid: true };
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFilename(originalName: string): string {
  const extension = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomString}${extension}`;
}

/**
 * Saves uploaded file to the public/uploads directory
 */
export async function saveUploadedFile(
  file: File,
  subDirectory: "images" | "audio"
): Promise<UploadedFile> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create upload directory if it doesn't exist
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "expose-corner",
    subDirectory
  );
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(uploadDir, filename);

  // Save file
  await writeFile(filepath, buffer);

  // Return file info
  const url = `/uploads/expose-corner/${subDirectory}/${filename}`;
  return {
    filename,
    url,
    size: file.size,
    type: file.type,
  };
}

/**
 * Deletes a file from the uploads directory
 */
export async function deleteUploadedFile(fileUrl: string): Promise<void> {
  try {
    // Convert URL to file path
    const relativePath = fileUrl.replace("/uploads/", "");
    const filepath = path.join(
      process.cwd(),
      "public",
      "uploads",
      relativePath
    );

    // Delete file if it exists
    if (existsSync(filepath)) {
      await unlink(filepath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    // Don't throw error - file cleanup is not critical
  }
}

/**
 * Cleans up files associated with an expired expose
 */
export async function cleanupExpiredFiles(
  imageUrls: string[],
  audioUrl?: string
): Promise<void> {
  const filesToDelete = [...imageUrls];
  if (audioUrl) {
    filesToDelete.push(audioUrl);
  }

  // Delete all files concurrently
  await Promise.allSettled(filesToDelete.map((url) => deleteUploadedFile(url)));
}

/**
 * Sanitizes filename to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
    .replace(/\.+/g, ".") // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, "") // Remove leading/trailing dots
    .substring(0, 100); // Limit length
}
