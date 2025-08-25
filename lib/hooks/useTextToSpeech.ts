"use client";
import { useState, useRef, useCallback } from "react";

export interface TextToSpeechState {
  isGenerating: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  error: string | null;
  progress: number;
  duration: number;
}

export const useTextToSpeech = () => {
  const [state, setState] = useState<TextToSpeechState>({
    isGenerating: false,
    isPlaying: false,
    isPaused: false,
    error: null,
    progress: 0,
    duration: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Web Speech API function with Microsoft Mark voice prioritization
  const generateWebSpeech = useCallback(async (text: string) => {
    try {
      if (!("speechSynthesis" in window)) {
        throw new Error("Speech synthesis not supported in this browser");
      }

      // Clean text for speech
      const cleanText = text.replace(/<[^>]*>/g, "").substring(0, 3000);

      // Wait for voices to load if they haven't already
      const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
        return new Promise((resolve) => {
          let voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve(voices);
          } else {
            speechSynthesis.onvoiceschanged = () => {
              voices = speechSynthesis.getVoices();
              resolve(voices);
            };
          }
        });
      };

      const voices = await getVoices();

      // Find Microsoft Mark voice specifically
      const findMicrosoftMarkVoice = (voices: SpeechSynthesisVoice[]) => {
        // Priority order for Microsoft Mark voices
        const markVoicePreferences = [
          "Microsoft Mark - English (United States)",
          "Mark - English (United States)",
          "Mark",
          "Microsoft David - English (United States)",
          "David",
          // Fallback to other quality male voices
          "Google UK English Male",
          "Google US English Male",
          "Alex",
          "Daniel",
        ];

        for (const preference of markVoicePreferences) {
          const voice = voices.find((v) => v.name === preference);
          if (voice && voice.lang.startsWith("en")) {
            console.log("Selected Microsoft voice:", voice.name, voice.lang);
            return voice;
          }
        }

        // Pattern matching for Mark voices
        const markVoice = voices.find(
          (v) => /mark/i.test(v.name) && v.lang.startsWith("en")
        );
        if (markVoice) {
          console.log("Selected Mark voice (pattern):", markVoice.name);
          return markVoice;
        }

        // Fallback to any English male voice
        const maleVoice = voices.find(
          (v) =>
            (/male/i.test(v.name) || /man/i.test(v.name)) &&
            v.lang.startsWith("en")
        );
        if (maleVoice) {
          console.log("Selected male voice:", maleVoice.name);
          return maleVoice;
        }

        // Final fallback
        return voices.find((v) => v.lang.startsWith("en")) || voices[0];
      };

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.85; // Slightly slower for better comprehension
      utterance.pitch = 0.9; // Slightly lower pitch for more masculine sound
      utterance.volume = 1;

      const selectedVoice = findMicrosoftMarkVoice(voices);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log("Using voice:", selectedVoice.name);
      }

      // Estimate duration (average speaking rate: 150 words per minute)
      const wordCount = cleanText.split(/\s+/).length;
      const estimatedDuration = (wordCount / 150) * 60; // seconds

      // Create audio-like controls for Web Speech API
      const webSpeechControls = {
        play: () => {
          if (speechSynthesis.paused) {
            speechSynthesis.resume();
          } else {
            speechSynthesis.speak(utterance);
          }
          setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
        },
        pause: () => {
          speechSynthesis.pause();
          setState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
        },
        stop: () => {
          speechSynthesis.cancel();
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            progress: 0,
          }));
        },
      };

      // Store controls for external access
      (window as any).webSpeechControls = webSpeechControls;

      // Handle speech synthesis events
      return new Promise<void>((resolve, reject) => {
        utterance.onstart = () => {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            isPlaying: true,
            duration: estimatedDuration,
            progress: 0,
          }));

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setState((prev) => {
              if (!prev.isPlaying) {
                clearInterval(progressInterval);
                return prev;
              }
              const newProgress = Math.min(
                prev.progress + 1,
                estimatedDuration
              );
              return { ...prev, progress: newProgress };
            });
          }, 1000);

          (window as any).speechProgressInterval = progressInterval;
        };

        utterance.onend = () => {
          if ((window as any).speechProgressInterval) {
            clearInterval((window as any).speechProgressInterval);
          }
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            progress: estimatedDuration,
          }));
          resolve();
        };

        utterance.onerror = (event) => {
          if ((window as any).speechProgressInterval) {
            clearInterval((window as any).speechProgressInterval);
          }
          setState((prev) => ({
            ...prev,
            error: "Speech synthesis failed",
            isGenerating: false,
            isPlaying: false,
          }));
          reject(new Error("Speech synthesis failed"));
        };

        speechSynthesis.speak(utterance);
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Web speech failed",
        isGenerating: false,
      }));
      throw error;
    }
  }, []);

  const generateAudio = useCallback(async (text: string) => {
    try {
      setState((prev) => ({
        ...prev,
        isGenerating: true,
        error: null,
      }));

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        // ElevenLabs API failed - fall back to Microsoft Mark voice via Web Speech API
        console.log(
          "ElevenLabs API failed, using Microsoft Mark voice fallback"
        );
        return generateWebSpeech(text);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Clean up previous audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      audioUrlRef.current = audioUrl;

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up audio event listeners
      audio.addEventListener("loadedmetadata", () => {
        setState((prev) => ({
          ...prev,
          duration: audio.duration,
          isGenerating: false,
        }));
      });

      audio.addEventListener("timeupdate", () => {
        setState((prev) => ({
          ...prev,
          progress: audio.currentTime,
        }));
      });

      audio.addEventListener("ended", () => {
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          progress: 0,
        }));
      });

      audio.addEventListener("error", () => {
        setState((prev) => ({
          ...prev,
          error: "Audio playback failed",
          isGenerating: false,
          isPlaying: false,
        }));
      });

      setState((prev) => ({
        ...prev,
        isGenerating: false,
      }));
    } catch (error) {
      console.error("Audio generation error:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to generate audio",
        isGenerating: false,
      }));
    }
  }, []);

  const play = useCallback(() => {
    // Check if we're using Web Speech API (Microsoft Mark voice)
    if ((window as any).webSpeechControls) {
      (window as any).webSpeechControls.play();
    } else if (audioRef.current) {
      audioRef.current.play();
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));
    }
  }, []);

  const pause = useCallback(() => {
    // Check if we're using Web Speech API (Microsoft Mark voice)
    if ((window as any).webSpeechControls) {
      (window as any).webSpeechControls.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
      }));
    }
  }, []);

  const stop = useCallback(() => {
    // Check if we're using Web Speech API (Microsoft Mark voice)
    if ((window as any).webSpeechControls) {
      (window as any).webSpeechControls.stop();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        progress: 0,
      }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    // Web Speech API doesn't support seeking, only regular audio does
    if (audioRef.current && !(window as any).webSpeechControls) {
      audioRef.current.currentTime = time;
      setState((prev) => ({
        ...prev,
        progress: time,
      }));
    }
  }, []);

  const cleanup = useCallback(() => {
    // Clean up Web Speech API
    if ((window as any).webSpeechControls) {
      speechSynthesis.cancel();
      if ((window as any).speechProgressInterval) {
        clearInterval((window as any).speechProgressInterval);
      }
      delete (window as any).webSpeechControls;
      delete (window as any).speechProgressInterval;
    }

    // Clean up regular audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setState({
      isGenerating: false,
      isPlaying: false,
      isPaused: false,
      error: null,
      progress: 0,
      duration: 0,
    });
  }, []);

  return {
    ...state,
    generateAudio,
    play,
    pause,
    stop,
    seek,
    cleanup,
  };
};
