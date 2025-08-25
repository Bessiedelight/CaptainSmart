"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Pause,
  AlertCircle,
} from "lucide-react";
import { PREDEFINED_HASHTAGS } from "@/lib/constants";
import { ValidationErrorDisplay } from "@/components/ErrorDisplay";

interface ExposeFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    hashtag: string;
    imageFiles: File[];
    audioFile?: File;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function ExposeForm({
  onSubmit,
  isSubmitting = false,
}: ExposeFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hashtag: "",
    customHashtag: "",
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomHashtag, setShowCustomHashtag] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup audio URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecordedAudio(blob);

        // Create audio file from blob
        const file = new File([blob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setAudioFile(file);

        // Create URL for playback
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setErrors((prev) => ({
        ...prev,
        audio: "Could not access microphone. Please check permissions.",
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordedAudio(null);
    setAudioFile(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 2000) {
      newErrors.description = "Description must be 2000 characters or less";
    }

    const selectedHashtag = showCustomHashtag
      ? formData.customHashtag
      : formData.hashtag;
    if (!selectedHashtag) {
      newErrors.hashtag = "Hashtag is required";
    } else if (showCustomHashtag) {
      if (!selectedHashtag.startsWith("#")) {
        newErrors.hashtag = "Custom hashtag must start with #";
      } else if (selectedHashtag.length < 2 || selectedHashtag.length > 50) {
        newErrors.hashtag = "Hashtag must be between 2-50 characters";
      }
    }

    if (imageFiles.length > 5) {
      newErrors.images = "Maximum 5 images allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (imageFiles.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, images: "Maximum 5 images allowed" }));
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          images: "Only image files are allowed",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          images: "Each image must be 5MB or less",
        }));
        return;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setErrors((prev) => ({ ...prev, audio: "Only audio files are allowed" }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        audio: "Audio file must be 10MB or less",
      }));
      return;
    }

    setAudioFile(file);
    setErrors((prev) => ({ ...prev, audio: "" }));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAudio = () => {
    deleteRecording();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const selectedHashtag = showCustomHashtag
      ? formData.customHashtag
      : formData.hashtag;

    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        hashtag: selectedHashtag,
        imageFiles,
        audioFile: audioFile || undefined,
      });

      // Reset form on success
      setFormData({
        title: "",
        description: "",
        hashtag: "",
        customHashtag: "",
      });
      setImageFiles([]);
      setAudioFile(null);
      setImagePreviews([]);
      setShowCustomHashtag(false);
      setErrors({});

      // Reset audio recording states
      deleteRecording();
      setIsRecording(false);
      setRecordingTime(0);
      setIsPlaying(false);

      if (imageInputRef.current) imageInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form-level validation errors */}
      {Object.keys(errors).length > 0 && (
        <ValidationErrorDisplay errors={errors} className="mb-4" />
      )}
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-gray-700 dark:border-gray-600 dark:text-white
            ${errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
          `}
          placeholder="Enter a descriptive title..."
          maxLength={200}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.title}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.title.length}/200 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={6}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-gray-700 dark:border-gray-600 dark:text-white
            ${errors.description ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
          `}
          placeholder="Tell your story in detail..."
          maxLength={2000}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.description}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/2000 characters
        </p>
      </div>

      {/* Hashtag */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hashtag *
        </label>

        {!showCustomHashtag ? (
          <div className="space-y-3">
            <select
              value={formData.hashtag}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, hashtag: e.target.value }))
              }
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${errors.hashtag ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
              `}
              disabled={isSubmitting}
            >
              <option value="">Select a hashtag...</option>
              {PREDEFINED_HASHTAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCustomHashtag(true)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              disabled={isSubmitting}
            >
              Or create a custom hashtag
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={formData.customHashtag}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customHashtag: e.target.value,
                }))
              }
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                dark:bg-gray-700 dark:border-gray-600 dark:text-white
                ${errors.hashtag ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
              `}
              placeholder="#your_custom_hashtag"
              maxLength={50}
              disabled={isSubmitting}
            />

            <button
              type="button"
              onClick={() => {
                setShowCustomHashtag(false);
                setFormData((prev) => ({ ...prev, customHashtag: "" }));
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              disabled={isSubmitting}
            >
              Choose from predefined hashtags
            </button>
          </div>
        )}

        {errors.hashtag && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.hashtag}
          </p>
        )}
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Images (Optional)
        </label>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            disabled={isSubmitting || imageFiles.length >= 5}
          >
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to upload images (max 5, 5MB each)
            </p>
          </button>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={isSubmitting}
          />

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {errors.images && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.images}
          </p>
        )}
      </div>

      {/* Audio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Audio Recording (Optional)
        </label>

        {!audioFile ? (
          <div className="space-y-4">
            {/* Recording Controls */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                  isRecording
                    ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                disabled={isSubmitting}
              >
                {isRecording ? (
                  <>
                    <Square className="w-8 h-8 mx-auto mb-2 text-red-500 animate-pulse" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Recording... {formatTime(recordingTime)}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Click to stop
                    </p>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Record Audio Message
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Click to start recording
                    </p>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                disabled={isSubmitting || isRecording}
              >
                <Mic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload Audio File
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Max 10MB
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {recordedAudio ? "Recorded Audio" : audioFile.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {recordedAudio
                      ? formatTime(recordingTime)
                      : "Uploaded file"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeAudio}
                className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audio Player for recorded audio */}
            {audioUrl && (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={isPlaying ? pauseRecording : playRecording}
                  className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                  disabled={isSubmitting}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-0"></div>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          className="hidden"
          disabled={isSubmitting}
        />

        {errors.audio && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.audio}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full py-3 px-4 rounded-md font-medium text-white
          transition-colors duration-200
          ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }
        `}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Publishing...
          </div>
        ) : (
          "Publish Exposé"
        )}
      </button>
    </form>
  );
}
