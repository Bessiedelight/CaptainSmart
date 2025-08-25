import { NextRequest, NextResponse } from "next/server";
import {
  validateFiles,
  saveUploadedFile,
  UploadedFile,
} from "@/lib/utils/fileUpload";

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Helper function to create error responses
function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
    },
    { status }
  );
}

// Helper function to handle file upload errors
function handleFileUploadError(error: unknown): NextResponse<ErrorResponse> {
  console.error("File upload error:", error);

  if (error && typeof error === "object" && "message" in error) {
    const fileError = error as any;

    // Handle specific file upload errors
    if (fileError.message?.includes("File too large")) {
      return createErrorResponse(
        "One or more files exceed the size limit",
        413,
        "FILE_TOO_LARGE"
      );
    }

    if (fileError.message?.includes("Invalid file type")) {
      return createErrorResponse(
        "Invalid file type. Only images and audio files are allowed.",
        400,
        "INVALID_FILE_TYPE"
      );
    }

    if (fileError.message?.includes("No space left")) {
      return createErrorResponse(
        "Server storage is full. Please try again later.",
        507,
        "INSUFFICIENT_STORAGE"
      );
    }

    if (fileError.message?.includes("Permission denied")) {
      return createErrorResponse(
        "Server permission error. Please try again later.",
        500,
        "PERMISSION_ERROR"
      );
    }
  }

  // Generic file upload error
  return createErrorResponse("Failed to upload files", 500, "UPLOAD_ERROR");
}

export async function POST(request: NextRequest) {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      return createErrorResponse(
        "Invalid form data. Please ensure you're sending a multipart/form-data request.",
        400,
        "INVALID_FORM_DATA"
      );
    }

    // Check if form data is empty
    if (!formData || Array.from(formData.entries()).length === 0) {
      return createErrorResponse(
        "No files provided in the request",
        400,
        "NO_FILES_PROVIDED"
      );
    }

    // Extract files from form data
    const imageFiles: File[] = [];
    const audioFiles: File[] = [];
    const invalidEntries: string[] = [];

    // Process all form entries
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Check if file is empty
        if (value.size === 0) {
          invalidEntries.push(`${key}: Empty file`);
          continue;
        }

        if (key.startsWith("images")) {
          imageFiles.push(value);
        } else if (key.startsWith("audio")) {
          audioFiles.push(value);
        } else {
          invalidEntries.push(`${key}: Unknown file field`);
        }
      } else if (value !== "") {
        // Non-file, non-empty entries
        invalidEntries.push(`${key}: Expected file, got ${typeof value}`);
      }
    }

    // Report invalid entries
    if (invalidEntries.length > 0) {
      return createErrorResponse(
        "Invalid form entries detected",
        400,
        "INVALID_FORM_ENTRIES",
        { invalidEntries }
      );
    }

    // Check if any files were provided
    if (imageFiles.length === 0 && audioFiles.length === 0) {
      return createErrorResponse(
        "No valid files found in the request",
        400,
        "NO_VALID_FILES"
      );
    }

    // Validate files
    const validation = validateFiles(imageFiles, audioFiles);
    if (!validation.isValid) {
      return createErrorResponse(
        validation.error || "File validation failed",
        400,
        "FILE_VALIDATION_ERROR",
        {
          imageCount: imageFiles.length,
          audioCount: audioFiles.length,
          maxImages: 5,
          maxImageSize: "5MB",
          maxAudioSize: "10MB",
        }
      );
    }

    const uploadedFiles: {
      images: UploadedFile[];
      audio?: UploadedFile;
    } = {
      images: [],
    };

    try {
      // Upload image files
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        try {
          const uploadedImage = await saveUploadedFile(imageFile, "images");
          uploadedFiles.images.push(uploadedImage);
        } catch (imageUploadError) {
          // Clean up any already uploaded files before throwing
          await cleanupUploadedFiles(uploadedFiles);

          return createErrorResponse(
            `Failed to upload image ${i + 1}: ${imageFile.name}`,
            500,
            "IMAGE_UPLOAD_ERROR",
            {
              fileName: imageFile.name,
              fileIndex: i,
              error:
                imageUploadError instanceof Error
                  ? imageUploadError.message
                  : "Unknown error",
            }
          );
        }
      }

      // Upload audio file (if provided)
      if (audioFiles.length > 0) {
        const audioFile = audioFiles[0];
        try {
          const uploadedAudio = await saveUploadedFile(audioFile, "audio");
          uploadedFiles.audio = uploadedAudio;
        } catch (audioUploadError) {
          // Clean up any already uploaded files before throwing
          await cleanupUploadedFiles(uploadedFiles);

          return createErrorResponse(
            `Failed to upload audio file: ${audioFile.name}`,
            500,
            "AUDIO_UPLOAD_ERROR",
            {
              fileName: audioFile.name,
              error:
                audioUploadError instanceof Error
                  ? audioUploadError.message
                  : "Unknown error",
            }
          );
        }
      }

      // Return successful upload response
      return NextResponse.json({
        success: true,
        data: {
          imageUrls: uploadedFiles.images.map((file) => file.url),
          audioUrl: uploadedFiles.audio?.url || null,
          uploadedFiles,
          summary: {
            imagesUploaded: uploadedFiles.images.length,
            audioUploaded: !!uploadedFiles.audio,
            totalFiles:
              uploadedFiles.images.length + (uploadedFiles.audio ? 1 : 0),
          },
        },
      });
    } catch (uploadError) {
      // Clean up any partially uploaded files
      await cleanupUploadedFiles(uploadedFiles);
      return handleFileUploadError(uploadError);
    }
  } catch (error) {
    return handleFileUploadError(error);
  }
}

// Helper function to clean up uploaded files
async function cleanupUploadedFiles(uploadedFiles: {
  images: UploadedFile[];
  audio?: UploadedFile;
}) {
  try {
    const { deleteUploadedFile } = await import("@/lib/utils/fileUpload");

    // Delete uploaded images
    for (const image of uploadedFiles.images) {
      try {
        await deleteUploadedFile(image.url);
      } catch (cleanupError) {
        console.error(`Failed to cleanup image ${image.url}:`, cleanupError);
      }
    }

    // Delete uploaded audio
    if (uploadedFiles.audio) {
      try {
        await deleteUploadedFile(uploadedFiles.audio.url);
      } catch (cleanupError) {
        console.error(
          `Failed to cleanup audio ${uploadedFiles.audio.url}:`,
          cleanupError
        );
      }
    }
  } catch (importError) {
    console.error("Failed to import cleanup function:", importError);
  }
}

// Handle unsupported methods
export async function GET() {
  return createErrorResponse(
    "Method not allowed. Use POST to upload files.",
    405,
    "METHOD_NOT_ALLOWED"
  );
}

export async function PUT() {
  return createErrorResponse(
    "Method not allowed. Use POST to upload files.",
    405,
    "METHOD_NOT_ALLOWED"
  );
}

export async function DELETE() {
  return createErrorResponse(
    "Method not allowed. Use POST to upload files.",
    405,
    "METHOD_NOT_ALLOWED"
  );
}
