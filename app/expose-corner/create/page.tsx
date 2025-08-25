"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Shield, Clock } from "lucide-react";
import ExposeForm from "@/components/ExposeForm";
import ExposeCornerNavbar from "@/components/ExposeCornerNavbar";
import ErrorDisplay from "@/components/ErrorDisplay";

export default function CreateExposePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    description: string;
    hashtag: string;
    imageFiles: File[];
    audioFile?: File;
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setErrorCode(null);
    setErrorDetails(null);

    try {
      let imageUrls: string[] = [];
      let audioUrl: string | undefined;

      // Upload files if any
      if (data.imageFiles.length > 0 || data.audioFile) {
        const formData = new FormData();

        // Add image files
        data.imageFiles.forEach((file, index) => {
          formData.append(`images[${index}]`, file);
        });

        // Add audio file
        if (data.audioFile) {
          formData.append("audio", data.audioFile);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for file uploads

        const uploadResponse = await fetch("/api/expose/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json().catch(() => ({}));
          const errorMessage =
            uploadData.error || `File upload failed (${uploadResponse.status})`;
          const errorCode =
            uploadData.code ||
            (uploadResponse.status >= 500 ? "SERVER_ERROR" : "UPLOAD_ERROR");

          throw new Error(
            JSON.stringify({
              message: errorMessage,
              code: errorCode,
              status: uploadResponse.status,
              details: uploadData.details,
              stage: "upload",
            })
          );
        }

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          throw new Error(
            JSON.stringify({
              message: uploadData.error || "File upload failed",
              code: uploadData.code || "UPLOAD_FAILED",
              details: uploadData.details,
              stage: "upload",
            })
          );
        }

        imageUrls = uploadData.data.imageUrls || [];
        audioUrl = uploadData.data.audioUrl || undefined;
      }

      // Create the expose
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000); // 10 second timeout for expose creation

      const exposeResponse = await fetch("/api/expose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          hashtag: data.hashtag,
          imageUrls,
          audioUrl,
        }),
        signal: controller2.signal,
      });

      clearTimeout(timeoutId2);

      if (!exposeResponse.ok) {
        const exposeData = await exposeResponse.json().catch(() => ({}));
        const errorMessage =
          exposeData.error ||
          `Failed to create expose (${exposeResponse.status})`;
        const errorCode =
          exposeData.code ||
          (exposeResponse.status >= 500 ? "SERVER_ERROR" : "CREATE_ERROR");

        throw new Error(
          JSON.stringify({
            message: errorMessage,
            code: errorCode,
            status: exposeResponse.status,
            details: exposeData.details,
            stage: "create",
          })
        );
      }

      const exposeData = await exposeResponse.json();

      if (!exposeData.success) {
        throw new Error(
          JSON.stringify({
            message: exposeData.error || "Failed to create expose",
            code: exposeData.code || "CREATE_FAILED",
            details: exposeData.details,
            stage: "create",
          })
        );
      }

      setSubmitSuccess(true);

      // Redirect to the main page after a short delay
      setTimeout(() => {
        router.push("/expose-corner");
      }, 2000);
    } catch (error) {
      console.error("Submit error:", error);

      let errorMessage = "Failed to create expose";
      let errorCode = "SUBMIT_ERROR";
      let errorDetails = null;

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
          errorCode = "TIMEOUT_ERROR";
        } else if (error.message.startsWith("{")) {
          try {
            const parsedError = JSON.parse(error.message);
            errorMessage = parsedError.message;
            errorCode = parsedError.code;
            errorDetails = parsedError.details;
          } catch {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      setSubmitError(errorMessage);
      setErrorCode(errorCode);
      setErrorDetails(errorDetails);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Exposé Published!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your anonymous report has been successfully published and is now
            visible to the community.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your exposé will automatically expire in 4 days
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you back to the main page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/expose-corner"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Expose Corner</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Exposé
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your anonymous report with the community
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {submitError && (
                  <ErrorDisplay
                    error={submitError}
                    errorCode={errorCode || undefined}
                    variant="card"
                    title="Failed to publish exposé"
                    showRetry={true}
                    onRetry={() => {
                      setSubmitError(null);
                      setErrorCode(null);
                      setErrorDetails(null);
                    }}
                    details={errorDetails}
                    className="mb-6"
                  />
                )}

                <ExposeForm
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Privacy Notice */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Privacy Protected
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>No account or login required</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>No personal information stored</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Anonymous posting guaranteed</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Content expires automatically</span>
                  </li>
                </ul>
              </div>

              {/* Auto-Expiration Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Auto-Expiration
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Your exposé will automatically be deleted after 4 days to
                  protect privacy and encourage fresh content.
                </p>
                <div className="bg-blue-100 dark:bg-blue-900/40 rounded-md p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                    This ensures sensitive information doesn't remain online
                    indefinitely.
                  </p>
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Community Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Share factual information only</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Respect others' privacy</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Use appropriate hashtags</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>No hate speech or harassment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Provide context and evidence when possible</span>
                  </li>
                </ul>
              </div>

              {/* File Upload Limits */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Upload Limits
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Images:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      Max 5 files, 5MB each
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Audio:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      Max 1 file, 10MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total:
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      30MB per exposé
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
