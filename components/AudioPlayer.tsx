"use client";
import React from "react";
import { Play, Pause, Square, Volume2, Loader2 } from "lucide-react";
import { useTextToSpeech } from "@/lib/hooks/useTextToSpeech";

interface AudioPlayerProps {
  text: string;
  title?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  title = "Listen to Article",
}) => {
  const {
    isGenerating,
    isPlaying,
    isPaused,
    error,
    progress,
    duration,
    generateAudio,
    play,
    pause,
    stop,
    seek,
  } = useTextToSpeech();

  const hasAudio = duration > 0;
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow seeking with ElevenLabs audio, not Web Speech API (Microsoft Mark voice)
    if (duration > 0 && !(window as any).webSpeechControls) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickPercentage = clickX / rect.width;
      const newTime = clickPercentage * duration;
      seek(newTime);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#D4A299] rounded-full flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">AI Generated Audio</p>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {/* Audio Controls */}
      <div className="space-y-4">
        {/* Main Controls */}
        <div className="flex items-center space-x-4">
          {!hasAudio && !isGenerating && (
            <button
              onClick={() => generateAudio(text)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#D4A299] text-white rounded-lg hover:bg-[#B8927A] transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Generate Audio</span>
            </button>
          )}

          {isGenerating && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Audio...</span>
            </div>
          )}

          {hasAudio && (
            <div className="flex items-center space-x-2">
              <button
                onClick={isPlaying ? pause : play}
                className="w-10 h-10 bg-[#D4A299] text-white rounded-full flex items-center justify-center hover:bg-[#B8927A] transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={stop}
                className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <Square className="w-4 h-4" />
              </button>

              <div className="text-sm text-gray-500 ml-2">
                {formatTime(progress)} / {formatTime(duration)}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {hasAudio && (
          <div className="space-y-2">
            <div
              className={`w-full h-2 bg-gray-200 rounded-full ${
                (window as any).webSpeechControls
                  ? "cursor-default"
                  : "cursor-pointer"
              }`}
              onClick={handleProgressClick}
              title={
                (window as any).webSpeechControls
                  ? "Using Microsoft Mark voice - seeking not available"
                  : "Click to seek"
              }
            >
              <div
                className="h-full bg-[#D4A299] rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {(window as any).webSpeechControls && (
              <div className="text-xs text-gray-400 text-center">
                Using Microsoft Mark voice - seeking not available
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {isGenerating && (
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Converting article to speech using AI...</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              This may take a few moments depending on article length
            </div>
          </div>
        )}

        {hasAudio && !isPlaying && !isPaused && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            Audio ready! Click play to listen to the article.
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
